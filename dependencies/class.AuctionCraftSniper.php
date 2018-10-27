<?php /** @noinspection ALL */

class AuctionCraftSniper
{

    /**
     * @var object $connection [database connection]
     */
    private $connection;

    /**
     * @var array $regions [valid regions as strings ]
     */
    private $regions = ['EU', 'US'];

    /**
     * @var array $realms [private realms to be filled by setRealms()]
     */
    private $realms = [];

    /**
     * @var array $professions [private professions to be filled by setProfessions()]
     */
    private $professions = [];

    /**
     * @var array $recipes [contains valid recipes]
     */
    private $recipes = [];

    /**
     * @var array [long list of all relevant itemIDs]
     */
    private $itemIDs = [];

    /**
     * @var bool|mysqli_result|string
     */
    private $OAuthAccessToken = '';


    /**
     * @method __construct
     * @param boolean $indexInit [controls automatic filling of $realms and $professions; default false]
     */
    public function __construct() {
        $db = require_once 'db.php';

        $this->connection = new mysqli($db['host'], $db['user'], $db['pw'], $db['db']);
        $this->connection->set_charset('utf8');

        $this->OAuthAccessToken = $this->refreshOAuthAccessToken();
    }

    /**
     *
     */
    final private function setItemIDs() {
        $itemIDQuery = 'SELECT `id` FROM `recipes` ORDER BY `id` ASC';

        $data = $this->connection->query($itemIDQuery);

        if ($data->num_rows > 0) {
            while ($stream = $data->fetch_assoc()) {
                $this->itemIDs[] = $stream['id'];
            }
        }
    }

    /**
     * @return array
     */
    final public function getItemIDs() {
        if (empty($this->itemIDs)) {
            $this->setItemIDs();
        }

        return $this->itemIDs;
    }

    /**
     * @return array
     */
    final public function getRecipes() {
        if (empty($this->recipes)) {
            $this->setRecipes();
        }

        return $this->recipes;
    }

    /**
     * @param array $professionsToQuery [professionIDs to query]
     */
    final private function setRecipes(array $professionsToQuery = []) {

        $validProfessions = array_keys($this->professions);

        $tmpProfessionsToQuery = [];

        foreach ($professionsToQuery as $professionID) {
            if (in_array((int)$professionID, $validProfessions)) {
                $tmpProfessionsToQuery[] = $professionID;
            }
        }

        if (!empty($tmpProfessionsToQuery)) {
            $recipesQuery = 'SELECT * FROM `recipes` WHERE `profession` = ';

            foreach ($tmpProfessionsToQuery as $tmpProfessionID) {
                $recipesQuery .= $tmpProfessionID . ' OR `profession` = ';
            }

            $recipesQuery = substr($recipesQuery, 0, -19) . ' ORDER BY `id` DESC, `name` ASC';

            $data = $this->connection->query($recipesQuery);

            if ($data->num_rows > 0) {
                while ($stream = $data->fetch_assoc()) {
                    $this->recipes[$stream['profession']][] = [
                        'recipeID'   => $stream['id'],
                        'recipeName' => $stream['name'],
                    ];
                }
            }
        }
    }

    /**
     * @method setRealms [initializes private realm array]
     */
    final private function setRealms() {
        foreach ($this->regions as $region) {
            $realmQuery = "SELECT `house`, `name` FROM `realms` WHERE `region` = '" . $region . "' ORDER BY `name` ASC";
            $data       = $this->connection->query($realmQuery);

            if ($data->num_rows > 0) {
                while ($stream = $data->fetch_assoc()) {
                    $this->realms[] = $region . '-' . $stream['name'];
                }
            }
        }
    }

    /**
     * @method setProfessions [initializes private profession array]
     */
    final private function setProfessions() {
        $professionQuery = "SELECT * FROM `professions` ORDER BY `name` ASC";

        $data = $this->connection->query($professionQuery);

        if ($data->num_rows > 0) {
            while ($stream = $data->fetch_assoc()) {
                $this->professions[$stream['id']] = $stream['name'];
            }
        }
    }

    /**
     * @method getProfessions [returns private profession array]
     */
    final public function getProfessions() {
        if (empty($this->professions)) {
            $this->setProfessions();
        }

        return $this->professions;
    }

    /**
     * @method getRealms [returns private realm array]
     */
    final public function getRealms() {
        if (empty($this->realms)) {
            $this->setRealms();
        }

        return $this->realms;
    }

    /**
     * @method realEscapeString [shorthand for mysqli->real_escape_string]
     *
     * @param string $string
     *
     * @return string
     */
    final private function realEscapeString(string $string = '') {
        return $this->connection->real_escape_string($string);
    }

    /**
     * @method validateRegionRealm [validates Region + Realm combination and returns corresponding house]
     *
     * @param string $region
     * @param string $realm
     *
     * @return int
     */
    final public function validateRegionRealm(string $region = '', string $realm = '') {

        $validationQuery = 'SELECT `house` FROM `realms` WHERE `region` = "' . $this->realEscapeString($region) . '" AND `name` = "' . $this->realEscapeString($realm) . '"';

        $data = $this->connection->query($validationQuery);

        if ($data->num_rows === 1) {
            while ($stream = $data->fetch_assoc()) {
                return $stream['house'];
            }
        }

        return 0;
    }

    /**
     * @method isHouseOutdated [checks whether a house has been fetched during the last 20 minutes]
     *
     * @param int $houseID
     *
     * @return bool
     */
    final public function isHouseOutdated(int $houseID = 0) {
        $getLastUpdateTimestampQuery = "SELECT `timestamp` FROM `auctionData` WHERE `houseID` = " . $houseID . " LIMIT 1";

        $lastUpdateTimestamp = 0;

        // assume house has never been fetched before
        $houseRequiresUpdate = true;

        $data = $this->connection->query($getLastUpdateTimestampQuery);

        // house has been previously fetched, check whether it needs an update
        if ($data->num_rows > 0) {

            while ($stream = $data->fetch_assoc()) {
                $lastUpdateTimestamp = (int)$stream['timestamp'];
            }

            // AH data supposedly updates once every 20 minutes
            $houseRequiresUpdate = $lastUpdateTimestamp < time() - 20 * 60;
        }

        if ($houseRequiresUpdate) {

            $outerAuctionData = $this->getOuterAuctionData($houseID);

            $this->setDirectHouseURL($houseID, $outerAuctionData['files'][0]['url']);

            // AH technically is older than 20 minutes, but API servers haven't updated yet
            if ($outerAuctionData['files'][0]['lastModified'] / 1000 <= $lastUpdateTimestamp) {
                $houseRequiresUpdate = false;
            }
        }

        return $houseRequiresUpdate;
    }

    /**
     * @param int $houseID
     *
     * @return array
     */
    final private function getOuterAuctionData(int $houseID = 0) {
        $curl = curl_init();

        curl_setopt_array($curl, [
            CURLOPT_URL            => $this->getAuctionSourceURL($houseID),
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $response = curl_exec($curl);

        curl_close($curl);

        $outerAuctionData = (array)json_decode($response, true);

        return $outerAuctionData;
    }

    /**
     * @param int $houseID
     *
     * @return bool
     */
    final public function getInnerAuctionURL(int $houseID = 0) {
        $getInnerAuctionURLQuery = 'SELECT `auctionURL` FROM `realms` WHERE `house` = ' . $houseID . ' LIMIT 1';

        $data = $this->connection->query($getInnerAuctionURLQuery);

        if ($data->num_rows === 1) {

            while ($stream = $data->fetch_assoc()) {
                return $stream['auctionURL'];
            }
        }

        return false;
    }

    /**
     * @param int    $houseID
     * @param string $houseURL
     */
    final private function setDirectHouseURL(int $houseID = 0, string $houseURL = '') {
        $setDirectHouseURLQuery = 'UPDATE `realms` SET `auctionURL` = "' . $houseURL . '" WHERE `house` = ' . $houseID;

        $this->connection->query($setDirectHouseURLQuery);
    }

    /**
     * @method getAuctionsURL [retrieves auctionURL depending on current house]
     *
     * @param int $house
     *
     * @return string
     */
    final public function getAuctionSourceURL(int $house = 0) {

        $getAuctionsURLQuery = 'SELECT `region`, `slug` FROM `realms` WHERE `house` = ' . $house . ' LIMIT 1';

        $data = $this->connection->query($getAuctionsURLQuery);

        if ($data->num_rows === 1) {

            while ($stream = $data->fetch_assoc()) {
                return 'https://' . strtolower($stream['region']) . '.api.blizzard.com/wow/auction/data/' . $stream['slug'] . '?access_token=' . $this->OAuthAccessToken;
            }
        }

        return false;
    }

    /**
     * @param int   $house
     * @param array $auctionValues
     *
     * @return bool|string
     */
    final public function updateHouse(int $house = 0, array $auctionValues = []) {

        $removePreviousDataQuery = 'DELETE FROM `auctionData` WHERE `houseID` = ' . $house;

        $this->connection->query($removePreviousDataQuery);

        $now = time();

        $insertHouseDataQuery = 'INSERT INTO `auctionData` (`houseID`, `itemID`, `buyout`, `timestamp`) VALUES ';

        foreach ($auctionValues as $itemID => $buyout) {
            $insertHouseDataQuery .= '(' . $house . ', ' . $itemID . ', ' . $buyout . ', ' . $now . '), ';
        }

        $insertHouseDataQuery = substr($insertHouseDataQuery, 0, -2);

        $this->connection->query($insertHouseDataQuery);

        return $insertHouseDataQuery;
    }

    /**
     * @return array
     */
    final private function getPreviousTokenData() {
        $getPreviousTokenExpirationTimestampQuery = 'SELECT * FROM `OAuth`';

        $previousTokenData = [
            'clientID'            => '',
            'clientSecret'        => '',
            'expirationTimestamp' => 0,
            'token'               => '',
        ];

        $data = $this->connection->query($getPreviousTokenExpirationTimestampQuery);

        if ($data->num_rows === 1) {
            while ($stream = $data->fetch_assoc()) {
                $previousTokenData['expirationTimestamp'] = $stream['expires'];
                $previousTokenData['clientID']            = $stream['client_id'];
                $previousTokenData['clientSecret']        = $stream['client_secret'];
                $previousTokenData['token']               = $stream['token'];
            }
        }

        return $previousTokenData;
    }

    /**
     * @param string $token
     * @param int    $remainingTime
     *
     * @return bool|mysqli_result
     */
    final private function updateOAuthAccessToken(string $token = '', int $remainingTime = 0) {
        $updateOAuthAccessTokenQuery = 'UPDATE `OAuth` SET `token` = "' . $token . '", `expires` = ' . ($remainingTime + time());

        $this->connection->query($updateOAuthAccessTokenQuery);
    }

    /**
     * @return bool|mysqli_result
     */
    final private function refreshOAuthAccessToken() {

        $previousTokenData = $this->getPreviousTokenData();

        // only update OAuth token if expiration time > 1 min
        if ($previousTokenData['expirationTimestamp'] - time() < 60) {

            $refreshData = file_get_contents('https://eu.battle.net/oauth/token?client_id=' . $previousTokenData['clientID'] . '&client_secret=' . $previousTokenData['clientSecret'] . '&grant_type=client_credentials');
            $refreshData = (array)json_decode($refreshData);

            if (array_key_exists('access_token', $refreshData)) {
                $this->updateOAuthAccessToken($refreshData['access_token'], $refreshData['expires_in']);

                return $refreshData['access_token'];
            }

            return false;
        }

        return $previousTokenData['token'];
    }

    /**
     * @return bool|mysqli_result|string
     */
    final public function getOAuthAccessToken() {
        return $this->OAuthAccessToken;
    }
}
