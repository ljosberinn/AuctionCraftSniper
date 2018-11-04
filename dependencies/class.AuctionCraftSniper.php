<?php

class AuctionCraftSniper
{

    /**
     * @var object $connection [database connection]
     */
    private $connection;

    /**
     * @var array $regions [valid regions as strings]
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
     * @var array [long list of all relevant itemIDs]
     */
    private $recipeIDs = [];

    /**
     * @var bool|mysqli_result|string [contains current OAuthAccess token]
     */
    private $OAuthAccessToken = '';

    /**
     * @var array [contains valid expansion levels]
     */
    private $expansionLevels = [];

    /**
     * @var int [contains current expansionLevel]
     */
    private $expansionLevel = 0;

    /**
     * @var int [contains current houseID]
     */
    private $houseID = 0;

    private $materialIDs = [];

    private $calculationExemptionItemIDs = [];

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

    /* ---------------------------------------------------------------------------------------------------- */
    // GETTER //

    /**
     * @method getInnerAuctionData [clones remote auction house json locally]
     *
     * @return bool
     */
    public function getInnerAuctionData() {

        $json = fopen('../api/' . $this->houseID . '.json', 'w+');
        $ch   = curl_init();

        curl_setopt_array($ch, [
            CURLOPT_URL            => $this->getInnerAuctionURL(),
            CURLOPT_FILE           => $json,
            CURLOPT_HTTPHEADER     => 'Authorization: Bearer ' . $this->OAuthAccessToken,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        curl_exec($ch);

        return fclose($json);
    }

    /**
     * @method getRecipeIDs [fetches all recipeIDs dependant on expansionLevel]
     *
     * @return array
     */
    public function getRecipeIDs() {
        if (empty($this->recipeIDs)) {
            $this->setRecipeIDs();
        }

        return $this->recipeIDs;
    }

    public function getMaterialIDs() {
        if (empty($this->materialIDs)) {
            $this->setMaterialIDs();
        }

        return $this->materialIDs;
    }


    /**
     * @method getProfessions [returns private profession array]
     */
    public function getProfessions() {
        if (empty($this->professions)) {
            $this->setProfessions();
        }

        return $this->professions;
    }

    /**
     * @method getRealms [returns private realm array]
     */
    public function getRealms() {
        if (empty($this->realms)) {
            $this->setRealms();
        }

        return $this->realms;
    }

    /**
     * @method getOuterAuctionData [fetches remote outer auction data, indicating last update & inner auction url]
     *
     * @param int $houseID
     *
     * @return array
     */
    private function getOuterAuctionData() {
        $curl = curl_init();

        curl_setopt_array($curl, [
            CURLOPT_URL            => $this->getOuterAuctionURL(),
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
     * @method getInnerAuctionURL [fetches inner auction url from database]
     *
     * @param int $houseID
     *
     * @return bool
     */
    private function getInnerAuctionURL() {
        $getInnerAuctionURLQuery = 'SELECT `auctionURL` FROM `realms` WHERE `houseID` = ' . $this->houseID . ' LIMIT 1';

        $data = $this->connection->query($getInnerAuctionURLQuery);

        if ($data->num_rows === 1) {

            while ($stream = $data->fetch_assoc()) {
                return $stream['auctionURL'];
            }
        }

        return false;
    }

    /**
     * @method getAuctionsURL [retrieves auctionURL depending on current house]
     *
     * @return bool|string
     */
    private function getOuterAuctionURL() {

        $getAuctionsURLQuery = 'SELECT `region`, `slug` FROM `realms` WHERE `houseID` = ' . $this->houseID . ' LIMIT 1';

        $data = $this->connection->query($getAuctionsURLQuery);

        if ($data->num_rows === 1) {

            while ($stream = $data->fetch_assoc()) {
                return 'https://' . strtolower($stream['region']) . '.api.blizzard.com/wow/auction/data/' . $stream['slug'] . '?access_token=' . $this->OAuthAccessToken;
            }
        }

        return false;
    }

    /**
     * @method getPreviousOAuthData [fetches previously set OAuthData from database]
     *
     * @return array
     */
    private function getPreviousOAuthTokenData() {
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
     * @method getExpansionLevels [returns valid expansion levels]
     *
     * @return array
     */
    public function getExpansionLevels() {
        if (empty($this->expansionLevels)) {
            $this->setExpansionLevels();
        }

        return $this->expansionLevels;
    }

    public function getProfessionData(array $professions = []) {

        $this->setCalculationExemptionsIDs();

        $professionTableData = [];

        $getCurrentlyAvailableRecipesQuery = 'SELECT
            `auctionData`.`itemID`,
            `auctionData`.`buyout`,
            `auctionData`.`timestamp`,
            `recipes`.`name`,
            `recipes`.`profession`
            FROM `auctionData`
            LEFT JOIN `recipes` ON `auctionData`.`itemID` = `recipes`.`id`
            WHERE `auctionData`.`houseID` = ' . $this->houseID . ' AND
            `auctionData`.`expansionLevel` = ' . $this->expansionLevel . ' AND';

        foreach ($professions as $professionID) {
            $getCurrentlyAvailableRecipesQuery .= ' `recipes`.`profession` = ' . $professionID . ' OR';
        }

        $getCurrentlyAvailableRecipesQuery = substr($getCurrentlyAvailableRecipesQuery, 0, -3);

        $data = $this->connection->query($getCurrentlyAvailableRecipesQuery);

        if ($data->num_rows > 0) {
            while ($stream = $data->fetch_assoc()) {
                $recipeData = [
                    'product'   => [
                        'item'     => $stream['itemID'],
                        'itemName' => $stream['name'],
                        'buyout'   => $stream['buyout'],
                    ],
                    'materials' => [],
                    'profit'    => $stream['buyout'],
                ];

                $getConnectedRecipeRequirementsQuery = 'SELECT `requiredItemID`, `requiredAmount`, `itemName`, `rank`, `baseBuyPrice` FROM `recipeRequirements` WHERE `recipe` = ' . $stream['itemID'] . ' AND (`rank` = 3 OR `rank` = 0)';

                $recipeRequirementData = $this->connection->query($getConnectedRecipeRequirementsQuery);

                while ($recipeStream = $recipeRequirementData->fetch_assoc()) {
                    $recipeData['materials'][] = $recipeStream;
                }

                foreach ($recipeData['materials'] as &$recipeMaterial) {
                    $recipeMaterial['buyout'] = 0;

                    // filter items that can be bought via vendors
                    if (!in_array($recipeMaterial['requiredItemID'], $this->calculationExemptionItemIDs)) {

                        // special case for recipes without rank
                        if ((int)$recipeMaterial['rank'] === 0) {
                            $recipeMaterial['buyout'] = $recipeMaterial['baseBuyPrice'];
                        } else {

                            $getMaterialBuyoutQuery = 'SELECT `buyout` FROM `auctionData` WHERE `itemID` = ' . $recipeMaterial['requiredItemID'] . ' AND `expansionLevel` = ' . $this->expansionLevel;

                            $materialBuyoutData = $this->connection->query($getMaterialBuyoutQuery);

                            if ($materialBuyoutData->num_rows === 1) {
                                while ($materialBuyoutDataStream = $materialBuyoutData->fetch_assoc()) {
                                    $recipeMaterial['buyout'] = $materialBuyoutDataStream['buyout'];
                                }
                            }
                        }

                        $recipeData['profit'] -= $recipeMaterial['buyout'] * $recipeMaterial['requiredAmount'];
                    }
                }

                $professionTableData[$stream['profession']][] = $recipeData;
            }
        }

        return $professionTableData;
    }

    /**
     * @return array
     */
    public function getCalculationExemptionItemIDs() {
        if (empty($this->calculationExemptionItemIDs)) {
            $this->setCalculationExemptionsIDs();
        }

        return $this->calculationExemptionItemIDs;
    }

    /* ---------------------------------------------------------------------------------------------------- */
    // SETTER //


    private function setMaterialIDs() {
        $materialIDsQuery = 'SELECT DISTINCT(`requiredItemID`) FROM `recipeRequirements` WHERE `expansionLevel` =  ' . $this->expansionLevel . ' ORDER BY `requiredItemID` ASC';

        $data = $this->connection->query($materialIDsQuery);

        if ($data->num_rows > 0) {
            while ($stream = $data->fetch_assoc()) {
                $this->materialIDs[] = $stream['requiredItemID'];
            }
        }
    }

    /**
     * @method setHouseID [sets current $houseID after validating]
     *
     * @param int $houseID
     *
     * @return bool
     */
    public function setHouseID(int $houseID = 0) {
        $houseID = $this->isValidHouse($houseID);

        if ($houseID) {
            $this->houseID = $houseID;

            return true;
        }

        return false;
    }

    /**
     * @method setExpansionLevel [sets current expansion level after validating]
     *
     * @param int $expansionLevel
     *
     * @return bool
     */
    public function setExpansionLevel(int $expansionLevel = 0) {
        $expansionLevel = $this->isValidExpansionLevel($expansionLevel);

        if ($expansionLevel) {
            $this->expansionLevel = $expansionLevel;

            return true;
        }

        return false;
    }

    /**
     * @method setRecipeIDs [fetches recipes depending on current expansionLevel]
     */
    private function setRecipeIDs() {
        $recipeIDsQuery = 'SELECT `id` FROM `recipes` WHERE `expansionLevel` =  ' . $this->expansionLevel . ' ORDER BY `id` ASC';

        $data = $this->connection->query($recipeIDsQuery);

        if ($data->num_rows > 0) {
            while ($stream = $data->fetch_assoc()) {
                $this->recipeIDs[] = $stream['id'];
            }
        }
    }

    /**
     * @method setRealms [initializes private realm array]
     */
    private function setRealms() {
        foreach ($this->regions as $region) {
            $realmQuery = "SELECT `houseID`, `name` FROM `realms` WHERE `region` = '" . $region . "' ORDER BY `name` ASC";
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
    private function setProfessions() {
        $professionQuery = "SELECT * FROM `professions` ORDER BY `name` ASC";

        $data = $this->connection->query($professionQuery);

        if ($data->num_rows > 0) {
            while ($stream = $data->fetch_assoc()) {
                $this->professions[$stream['id']] = $stream['name'];
            }
        }
    }

    /**
     * @method setInnerHouseURL [updates database to allow shortcutting update process the next time]
     *
     * @param string $houseURL
     */
    private function setInnerHouseURL(string $houseURL = '') {
        $setInnerHouseURLQuery = 'UPDATE `realms` SET `auctionURL` = "' . $houseURL . '" WHERE `houseID` = ' . $this->houseID;

        $this->connection->query($setInnerHouseURLQuery);
    }

    /**
     * @method setExpansionLevels [fetches expansionLevels from database]
     */
    private function setExpansionLevels() {
        $setExpansionLevelQuery = 'SELECT * FROM `expansionLevels` ORDER BY `level` ASC';

        $data = $this->connection->query($setExpansionLevelQuery);

        if ($data->num_rows > 0) {
            while ($stream = $data->fetch_assoc()) {
                $this->expansionLevels[$stream['level']] = $stream['name'];
            }
        }
    }

    /**
     * @method setCalculationExemptionIDs [extracts IDs of items that can be ignored when parsing data from database]
     */
    private function setCalculationExemptionsIDs() {
        $getVendorItemsQuery = 'SELECT `itemID` FROM `itemCalculationExemptions`';

        $data = $this->connection->query($getVendorItemsQuery);

        if ($data->num_rows > 0) {
            while ($stream = $data->fetch_assoc()) {
                $this->calculationExemptionItemIDs[] = $stream['itemID'];
            }
        }
    }


    /**
     * @method setRecipeRequirements [(re)builds all recipeRequirements for an expansion based upon existing recipes via the WoWDB API]
     *
     * @param array $recipeRequirements
     */
    public function setRecipeRequirements(array $recipeRequirements) {
        $removalQuery = 'DELETE * FROM `recipeRequirements` WHERE `expansionLevel` = ' . $this->expansionLevel;
        $this->connection->query($removalQuery);

        $insertQuery = 'INSERT INTO `recipeRequirements` (`recipe`, `requiredItemID`, `requiredAmount`, `itemName`, `rank`, `baseSellPrice`, `baseBuyPrice`, `expansionLevel`) VALUES ';

        foreach ($recipeRequirements as $recipeRequirement) {
            $requiredItemIDAmount = count($recipeRequirement['requiredItemIDs']);

            for ($i = 0; $i < $requiredItemIDAmount; $i += 1) {
                $insertQuery .= '(
                ' . $recipeRequirement['recipeID'] . ',
                ' . $recipeRequirement['requiredItemIDs'][$i] . ',
                ' . $recipeRequirement['requiredAmounts'][$i] . ',
                "' . $this->realEscapeString($recipeRequirement['itemNames'][$i]) . '",
                ' . $recipeRequirement['rank'] . ',
                ' . $recipeRequirement['baseSellPrices'][$i] . ',
                ' . $recipeRequirement['baseBuyPrices'][$i] . ',
                ' . $this->expansionLevel . '
                ), ';
            }
        }

        $insertQuery = substr($insertQuery, 0, -2);

        $this->connection->query($insertQuery);
    }

    /* ---------------------------------------------------------------------------------------------------- */
    // HELPER //

    /**
     * @method getWoWDBJson [returns decoded & trimmed WoWDBJson as array]
     *
     * @param string $affix
     *
     * @return mixed
     */
    public function getWoWDBJSON(string $affix = '') {
        $curl = curl_init();

        curl_setopt_array($curl, [
            CURLOPT_URL            => 'https://www.wowdb.com/api' . $affix,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        // trim () from start and end of invalid response JSON
        $response = substr(curl_exec($curl), 1, -1);

        curl_close($curl);

        return json_decode($response, true);
    }

    /**
     * @method realEscapeString [shorthand for mysqli->real_escape_string]
     *
     * @param string $string
     *
     * @return string
     */
    private function realEscapeString(string $string = '') {
        return $this->connection->real_escape_string($string);
    }

    /**
     * @method validateRegionRealm [validates Region + Realm combination and returns corresponding house]
     *
     * @param string $region
     * @param string $realm
     *
     * @return bool
     */
    public function validateRegionRealm(string $region = '', string $realm = '') {

        if (in_array(strtoupper($region), $this->regions)) {

            $validationQuery = 'SELECT `houseID` FROM `realms` WHERE `region` = "' . $this->realEscapeString($region) . '" AND `name` = "' . $this->realEscapeString($realm) . '"';

            $data = $this->connection->query($validationQuery);

            if ($data->num_rows === 1) {
                while ($stream = $data->fetch_assoc()) {
                    return $stream['houseID'];
                }
            }
        }

        return false;
    }

    /**
     * @method isHouseOutdated [checks whether a house has been fetched during the last 20 minutes]
     *
     * @return bool
     */
    public function isHouseOutdated() {
        $getLastUpdateTimestampQuery = "SELECT `timestamp` FROM `auctionData` WHERE `houseID` = " . $this->houseID . " AND `expansionLevel` = " . $this->expansionLevel . " LIMIT 1";

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

            $outerAuctionData = $this->getOuterAuctionData();

            $this->setInnerHouseURL($outerAuctionData['files'][0]['url']);

            // AH technically is older than 20 minutes, but API servers haven't updated yet
            if ($outerAuctionData['files'][0]['lastModified'] / 1000 <= $lastUpdateTimestamp) {
                $houseRequiresUpdate = false;
            }
        }

        return $houseRequiresUpdate;
    }

    /**
     * @method updateHouse [updates current house based on given recipeIDs and expansionLevel]
     *
     * @param array $recipeIDs
     */
    public function updateHouse(array $recipeIDs = []) {

        $removePreviousDataQuery = 'DELETE FROM `auctionData` WHERE `houseID` = ' . $this->houseID . ' AND `expansionLevel` = ' . $this->expansionLevel;

        $this->connection->query($removePreviousDataQuery);

        $now = time();

        $insertHouseDataQuery = 'INSERT INTO `auctionData` (`houseID`, `itemID`, `buyout`, `timestamp`, `expansionLevel`) VALUES ';

        foreach ($recipeIDs as $itemID => $buyout) {
            if ((int)$buyout !== 0) {
                $insertHouseDataQuery .= '(
                ' . $this->houseID . ',
                ' . $itemID . ',
                ' . $buyout . ',
                ' . $now . ',
                ' . $this->expansionLevel . '), ';
            }
        }

        $insertHouseDataQuery = substr($insertHouseDataQuery, 0, -2);

        $this->connection->query($insertHouseDataQuery);
    }

    /**
     * @method updateOAuthAccessToken [updates database to reflect new OAuthAccessToken]
     * @param string $token
     * @param int    $remainingTime
     */
    private function updateOAuthAccessToken(string $token = '', int $remainingTime = 0) {
        $updateOAuthAccessTokenQuery = 'UPDATE `OAuth` SET `token` = "' . $token . '", `expires` = ' . ($remainingTime + time());

        $this->connection->query($updateOAuthAccessTokenQuery);
    }

    /**
     * @method refreshOAuthAccessToken [refreshes OAuthAccessToken if its expiring within the next 60 seconds]
     *
     * @return bool|mysqli_result
     */
    private function refreshOAuthAccessToken() {

        $previousTokenData = $this->getPreviousOAuthTokenData();

        // only update OAuth token if expiration time > 1 min
        if ($previousTokenData['expirationTimestamp'] - time() < 60) {

            $curl = curl_init();

            curl_setopt_array($curl, [
                CURLOPT_URL            => 'https://eu.battle.net/oauth/token',
                CURLOPT_USERPWD        => $previousTokenData['clientID'] . ':' . $previousTokenData['clientSecret'],
                CURLOPT_POSTFIELDS     => 'grant_type=client_credentials',
                CURLOPT_POST           => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_SSL_VERIFYPEER => true,
            ]);

            $response = curl_exec($curl);
            curl_close($curl);

            $refreshData = (array)json_decode($response);

            if (array_key_exists('access_token', $refreshData)) {
                $this->updateOAuthAccessToken($refreshData['access_token'], $refreshData['expires_in']);

                return $refreshData['access_token'];
            }

            return false;
        }

        return $previousTokenData['token'];
    }

    /**
     * @method AreValidProfessions [validates professions against database]
     *
     * @param array $professionIDs
     *
     * @return array|bool
     */
    public function AreValidProfessions(array $professionIDs = []) {
        if (empty($this->professions)) {
            $this->getProfessions();
        }

        $validProfessions = array_keys($this->professions);

        foreach ($professionIDs as $professionID) {
            if (!in_array($professionID, $validProfessions)) {
                return false;
            }
        }

        return $professionIDs;
    }

    /**
     * @method public isValidHouse [validates houseID against database]
     *
     * @param int $houseID
     *
     * @return bool|int
     */
    private function isValidHouse(int $houseID = 0) {
        $validationQuery = 'SELECT `id` FROM `realms` WHERE `houseID` = ' . $houseID;

        $data = $this->connection->query($validationQuery);

        if ($data->num_rows >= 1) {
            return $houseID;
        }

        return false;
    }

    /**
     * @method isValidExpansionLevel [validates expansionLevel against database]
     *
     * @param int $expansionLevel
     *
     * @return bool|int
     */
    public function isValidExpansionLevel(int $expansionLevel = 8) {
        if (empty($this->expansionLevels)) {
            $this->getExpansionLevels();
        }

        if (!in_array($expansionLevel, array_keys($this->expansionLevels))) {
            return 8;
        }

        return $expansionLevel;
    }
}
