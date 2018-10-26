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
     * @method __construct
     * @param boolean $indexInit [controls automatic filling of $realms and $professions; default false]
     */
    public function __construct() {
        $db = require_once 'db.php';

        $this->connection = new mysqli($db['host'], $db['user'], $db['pw'], $db['db']);
        $this->connection->set_charset('utf8');
    }

    final private function setItemIDs() {
        $itemIDQuery = 'SELECT `id` FROM `recipes` ORDER BY `id` ASC';

        $data = $this->connection->query($itemIDQuery);

        if ($data->num_rows > 0) {
            while ($stream = $data->fetch_assoc()) {
                $this->itemIDs[] = $stream['id'];
            }
        }
    }

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
        $houseRequiresUpdate = false;

        $data = $this->connection->query($getLastUpdateTimestampQuery);

        // house has been previously fetched, check whether it needs an update
        if ($data->num_rows > 0) {

            while ($stream = $data->fetch_assoc()) {
                $lastUpdateTimestamp = (int)$stream['timestamp'];
            }

            // AH data supposedly updates once every 20 minutes
            $houseRequiresUpdate = $lastUpdateTimestamp < time() - 20 * 60;

        } else {
            // house has never been fetched before
            $houseRequiresUpdate = true;
        }

        return $houseRequiresUpdate;
    }

    /**
     * @method getAuctionsURL [retrieves auctionURL depending on current house]
     *
     * @param int $house
     *
     * @return string
     */
    final public function getAuctionsURL(int $house) {

        $getAuctionsURLQuery = 'SELECT `auctionURL` FROM `realms` WHERE `house` = ' . $house . ' LIMIT 1';

        $url = 'http://auction-api-eu.worldofwarcraft.com/auction-data/5aa60247a919dc537f694c4883a5f21f/auctions.json';

        /*$data = $this->connection->query($getAuctionsURLQuery);

        if ($data->num_rows === 1) {

            while ($stream = $data->fetch_assoc()) {
                $url = $stream['auctionURL'];
            }
        }*/

        return $url;
    }

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
}
