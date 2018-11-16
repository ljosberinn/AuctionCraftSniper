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

    /**
     * @var array [contains all materialIDs of current $professions]
     */
    private $materialIDs = [];

    /**
     * @var array [contains itemIDs whose cost will not be factored into the sum]
     */
    private $calculationExemptionItemIDs = [];

    private $PDO_OPTIONS = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    /**
     * @method __construct
     * @param boolean $indexInit [controls automatic filling of $realms and $professions; default false]
     */
    public function __construct() {
        $db = require_once 'db.php';

        $this->connection = new PDO('mysql:host=' . $db['host'] . ';dbname=' . $db['db'] . ';charset=utf8', $db['user'], $db['pw'], $this->PDO_OPTIONS);

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
        $getInnerAuctionURL = $this->connection->prepare('SELECT `auctionURL` FROM `realms` WHERE `houseID` = :houseID LIMIT 1');
        $getInnerAuctionURL->execute(['houseID' => $this->houseID]);

        if ($getInnerAuctionURL->rowCount() > 0) {

            foreach ($getInnerAuctionURL->fetch() as $auctionURL) {
                return $auctionURL;
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
        $getAuctionsURL = $this->connection->prepare('SELECT `region`, `slug` FROM `realms` WHERE `houseID` = :houseID LIMIT 1');

        $getAuctionsURL->execute(['houseID' => $this->houseID]);
        if ($getAuctionsURL->rowCount() > 0) {

            foreach ($getAuctionsURL->fetchAll() as $dataset) {
                return 'https://' . strtolower($dataset['region']) . '.api.blizzard.com/wow/auction/data/' . $dataset['slug'] . '?access_token=' . $this->OAuthAccessToken;
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
        $getPreviousTokenExpirationTimestamp = $this->connection->prepare('SELECT * FROM `OAuth`');
        $getPreviousTokenExpirationTimestamp->execute();

        $previousTokenData = $getPreviousTokenExpirationTimestamp->fetch();

        $previousTokenData = [
            'clientID'            => $previousTokenData['client_id'],
            'clientSecret'        => $previousTokenData['client_secret'],
            'expirationTimestamp' => $previousTokenData['expires'],
            'token'               => $previousTokenData['token'],
        ];

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

    /**
     * @method getCurrentlyAvailableRecipes [query building helper for getProfessions]
     *
     * @param array $professions
     *
     * @return bool|PDOStatement
     */
    private function getCurrentlyAvailableRecipes(array $professions = []) {
        $getCurrentlyAvailableRecipesQuery = 'SELECT
            `auctionData`.`itemID`,
            `auctionData`.`buyout`,
            `recipes`.`name`,
            `recipes`.`profession`,
            `houseUpdateTracker`.`timestamp`
            FROM `auctionData`
            LEFT JOIN `recipes` ON `auctionData`.`itemID` = `recipes`.`id`
            LEFT JOIN `houseUpdateTracker` on `houseUpdateTracker`.`houseID` = :houseID1 AND `houseUpdateTracker`.`expansionLevel` = :expansionLevel1
            WHERE `auctionData`.`houseID` = :houseID2 AND
            `auctionData`.`expansionLevel` = :expansionLevel2 AND
           ';

        $queryParams = [
            'houseID1'        => $this->houseID,
            'expansionLevel1' => $this->expansionLevel,
            'houseID2'        => $this->houseID,
            'expansionLevel2' => $this->expansionLevel,
        ];

        $professionCount = count($professions);

        foreach ($professions as $index => $professionID) {
            $getCurrentlyAvailableRecipesQuery  .= ' `recipes`.`profession` = :profession' . $index;
            $queryParams['profession' . $index] = $professionID;

            $getCurrentlyAvailableRecipesQuery .= array_search($professionID, $professions) < $professionCount - 1 ? ' OR' : '';
        }

        $getCurrentlyAvailableRecipes = $this->connection->prepare($getCurrentlyAvailableRecipesQuery);

        $getCurrentlyAvailableRecipes->execute($queryParams);

        return $getCurrentlyAvailableRecipes;
    }

    /**
     * @param array $professions
     *
     * @return array
     */
    public function getProfessionData(array $professions = []) {

        $this->setCalculationExemptionsIDs();
        $this->calculationExemptionItemIDs = array_flip($this->calculationExemptionItemIDs);

        $professionTableData = [];

        $getCurrentlyAvailableRecipes = $this->getCurrentlyAvailableRecipes($professions);

        if ($getCurrentlyAvailableRecipes->rowCount() > 0) {

            foreach ($getCurrentlyAvailableRecipes->fetchAll() as $recipe) {

                $recipeData = [
                    'product'   => [
                        'item'     => $recipe['itemID'],
                        'itemName' => $recipe['name'],
                        'buyout'   => $recipe['buyout'],
                    ],
                    'materials' => [],
                    'profit'    => $recipe['buyout'],
                ];

                $getConnectedRecipeRequirements = $this->connection->prepare('SELECT `requiredItemID`, `requiredAmount`, `itemName`, `rank`, `baseBuyPrice` FROM `recipeRequirements` WHERE `recipe` = :recipeID AND (`rank` = 3 OR `rank` = 0)');

                $getConnectedRecipeRequirements->execute([
                    'recipeID' => $recipe['itemID'],
                ]);

                if ($getConnectedRecipeRequirements->rowCount() > 0) {
                    foreach ($getConnectedRecipeRequirements->fetchAll() as $recipeRequirement) {
                        $recipeData['materials'][] = array_merge($recipeRequirement, ['buyout' => 0]);
                    }
                }

                foreach ($recipeData['materials'] as &$recipeMaterial) {
                    // filter items that can be bought via vendors or are soulbound
                    if (!array_key_exists($recipeMaterial['requiredItemId'], $this->calculationExemptionItemIDs)) {

                        // special case for recipes without rank
                        if ((int)$recipeMaterial['rank'] === 0) {
                            $recipeMaterial['buyout'] = $recipeMaterial['baseBuyPrice'];
                        } else {
                            $getMaterialBuyout = $this->connection->prepare('SELECT `buyout` FROM `auctionData` WHERE `itemID` = :itemID AND `expansionLevel` = :expansionLevel AND `houseID` = :houseID');

                            $getMaterialBuyout->execute([
                                'itemID'         => $recipeMaterial['requiredItemID'],
                                'expansionLevel' => $this->expansionLevel,
                                'houseID'        => $this->houseID,
                            ]);

                            if ($getMaterialBuyout->rowCount() === 1) {
                                $recipeMaterial['buyout'] = $getMaterialBuyout->fetch()['buyout'];
                            }
                        }

                        $recipeData['profit'] -= $recipeMaterial['buyout'] * $recipeMaterial['requiredAmount'];
                    }
                }

                $professionTableData[$recipe['profession']][] = $recipeData;
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
        $materialIDs = $this->connection->prepare('SELECT DISTINCT(`requiredItemID`) FROM `recipeRequirements` WHERE `expansionLevel` = :expansionLevel ORDER BY `requiredItemID` ASC');

        $materialIDs->execute(['expansionLevel' => $this->expansionLevel]);

        if ($materialIDs->rowCount() > 0) {
            foreach ($materialIDs->fetchAll() as $material) {
                $this->materialIDs[] = $material['requiredItemID'];
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
        $recipeIDs = $this->connection->prepare('SELECT `id` FROM `recipes` WHERE `expansionLevel` =  :expansionLevel ORDER BY `id` ASC');
        $recipeIDs->execute(['expansionLevel' => $this->expansionLevel]);

        if ($recipeIDs->rowCount() > 0) {
            foreach ($recipeIDs->fetchAll() as $dataset) {
                $this->recipeIDs[] = $dataset['id'];
            }
        }
    }

    /**
     * @method setRealms [initializes private realm array]
     */
    private function setRealms() {
        foreach ($this->regions as $region) {
            $realm = $this->connection->prepare('SELECT `houseID`, `name` FROM `realms` WHERE `region` = :region ORDER BY `name` ASC');
            $realm->execute(['region' => $region]);

            foreach ($realm->fetchAll() as $dataset) {
                $this->realms[] = $region . '-' . $dataset['name'];
            }
        }
    }

    /**
     * @method setProfessions [initializes private profession array]
     */
    private function setProfessions() {
        $profession = $this->connection->prepare('SELECT * FROM `professions` ORDER BY `name` ASC');
        $profession->execute();

        foreach ($profession->fetchAll() as $dataset) {
            $this->professions[$dataset['id']] = $dataset['name'];
        }
    }

    /**
     * @method setInnerHouseURL [updates database to allow shortcutting update process the next time]
     *
     * @param string $auctionURL
     */
    private function setInnerHouseURL(string $auctionURL = '') {
        $setInnerHouseURL = $this->connection->prepare('UPDATE `realms` SET `auctionURL` = :auctionURL WHERE `houseID` = :houseID');
        $setInnerHouseURL->execute([
            'auctionURL' => $auctionURL,
            'houseID'    => $this->houseID,
        ]);
    }

    /**
     * @method setExpansionLevels [fetches expansionLevels from database]
     */
    private function setExpansionLevels() {
        $setExpansionLevel = $this->connection->prepare('SELECT * FROM `expansionLevels` ORDER BY `level` ASC');
        $setExpansionLevel->execute();

        foreach ($setExpansionLevel->fetchAll() as $dataset) {
            $this->expansionLevels[$dataset['level']] = $dataset['name'];
        }
    }

    /**
     * @method setCalculationExemptionIDs [extracts IDs of items that can be ignored when parsing data from database]
     */
    private function setCalculationExemptionsIDs() {
        $getVendorItems = $this->connection->prepare('SELECT `itemID` FROM `itemCalculationExemptions`');
        $getVendorItems->execute();

        foreach ($getVendorItems->fetchAll() as $dataset) {
            $this->calculationExemptionItemIDs[] = $dataset['itemID'];
        }
    }


    /**
     * @method setRecipeRequirements [(re)builds all recipeRequirements for an expansion based upon existing recipes via the WoWDB API]
     *
     * @param array $recipeRequirements
     */
    public function setRecipeRequirements(array $recipeRequirements) {
        $previousDataRemoval = $this->connection->prepare('DELETE * FROM `recipeRequirements` WHERE `expansionLevel` = :expansionLevel');
        $previousDataRemoval->execute([
            'expansionLevel' => $this->expansionLevel,
        ]);

        $insert = $this->connection->prepare('INSERT INTO `recipeRequirements` (
                      `recipe`, `requiredItemID`, `requiredAmount`, `itemName`, `rank`, `baseSellPrice`, `baseBuyPrice`, `expansionLevel`) VALUES (
                      :recipeID, :requiredItemID, :requiredAmount, :itemName, :rank, :baseSellPrice, :baseBuyPrice, :expansionLevel)');

        foreach ($recipeRequirements as $recipeRequirement) {
            $requiredItemIDAmount = count($recipeRequirement['requiredItemIDs']);

            for ($i = 0; $i < $requiredItemIDAmount; $i += 1) {
                $insert->execute([
                    'recipeID'       => $recipeRequirement['recipeID'],
                    'requiredItemID' => $recipeRequirement['requiredItemIDs'][$i],
                    'requiredAmount' => $recipeRequirement['requiredAmounts'][$i],
                    'itemName'       => $recipeRequirement['itemNames'][$i],
                    'rank'           => $recipeRequirement['rank'],
                    'baseSellPrice'  => $recipeRequirement['baseSellPrices'][$i],
                    'baseBuyPrice'   => $recipeRequirement['baseBuyPrices'][$i],
                    'expansionLevel' => $this->expansionLevel,
                ]);
            }
        }
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
     * @method validateRegionRealm [validates Region + Realm combination and returns corresponding house]
     *
     * @param string $region
     * @param string $realm
     *
     * @return bool
     */
    public function validateRegionRealm(string $region = '', string $realm = '') {

        if (in_array(strtoupper($region), $this->regions)) {

            $validation = $this->connection->prepare('SELECT `houseID` FROM `realms` WHERE `region` = :region AND `name` = :name');
            $validation->execute([
                'region' => $region,
                'name'   => $realm,
            ]);

            if ($validation->rowCount() > 0) {
                foreach ($validation->fetch() as $columnName => $houseID) {
                    return $houseID;
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

        $getLastUpdateTimestamp = $this->connection->prepare("SELECT `timestamp` FROM `houseUpdateTracker` WHERE `houseID` = :houseID AND `expansionLevel` = :expansionLevel");
        $getLastUpdateTimestamp->execute([
            'houseID'        => $this->houseID,
            'expansionLevel' => $this->expansionLevel,
        ]);

        // assume house has never been fetched before
        $houseRequiresUpdate = true;
        $lastUpdateTimestamp = 0;

        #$data = $this->connection->query($getLastUpdateTimestampQuery);

        // house has been previously fetched, check whether it needs an update
        if ($getLastUpdateTimestamp->rowCount() === 1) {
            $lastUpdateTimestamp = $getLastUpdateTimestamp->fetch()['timestamp'];

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

        $queryParams = [
            'houseID'        => $this->houseID,
            'expansionLevel' => $this->expansionLevel,
        ];

        $removePreviousData = $this->connection->prepare('DELETE FROM `auctionData` WHERE `houseID` = :houseID AND `expansionLevel` = :expansionLevel');
        $removePreviousData->execute($queryParams);

        $insertHouseData = $this->connection->prepare('INSERT INTO `auctionData` (`houseID`, `itemID`, `buyout`, `expansionLevel`) VALUES (:houseID, :itemID, :buyout, :expansionLevel)');

        foreach ($recipeIDs as $itemID => $buyout) {
            if ((int)$buyout !== 0) {
                $insertHouseData->execute([
                    'houseID'        => $this->houseID,
                    'itemID'         => $itemID,
                    'buyout'         => $buyout,
                    'expansionLevel' => $this->expansionLevel,
                ]);
            }
        }

        $deletePreviousHouseUpdate = $this->connection->prepare('DELETE FROM `houseUpdateTracker` WHERE `houseID` = :houseID AND `expansionLevel` = :expansionLevel');
        $deletePreviousHouseUpdate->execute($queryParams);

        $insertHouseUpdate        = $this->connection->prepare('INSERT INTO `houseUpdateTracker` (`houseID`, `expansionLevel`, `timestamp`) VALUES(:houseID, :expansionLevel, :timestamp)');
        $queryParams['timestamp'] = time();

        $insertHouseUpdate->execute($queryParams);
    }

    /**
     * @method updateOAuthAccessToken [updates database to reflect new OAuthAccessToken]
     * @param string $token
     * @param int    $remainingTime
     */
    private function updateOAuthAccessToken(string $token = '', int $remainingTime = 0) {
        $updateOAuthAccessToken = $this->connection->prepare('UPDATE `OAuth` SET `token` = :token, `expires` = ' . ($remainingTime + time()));
        $updateOAuthAccessToken->execute(['token' => $token]);
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
        $validation = $this->connection->prepare('SELECT `id` FROM `realms` WHERE `houseID` = :houseID');

        $validation->execute(['houseID' => $houseID]);

        if ($validation->rowCount() > 0) {
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
