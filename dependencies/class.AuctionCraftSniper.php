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
     * @var bool|mysqli_result
     */
    private $OAuthAccessToken;

    /**
     * @var array [contains all materialIDs of current $professions]
     */
    private $materialIDs = [];

    /**
     * @var array [contains itemIDs whose cost will not be factored into the sum]
     */
    private $calculationExemptionItemIDs = [];

    /**
     * @method __construct
     */
    public function __construct() {
        $db = require 'db.php';

        $this->connection = new PDO('mysql:host=' . $db['host'] . ';dbname=' . $db['db'] . ';charset=utf8', $db['user'], $db['pw'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);

        $this->OAuthAccessToken = $this->refreshOAuthAccessToken();
    }

    /* ---------------------------------------------------------------------------------------------------- */
    // GETTER //

    /**
     * @method getInnerAuctionData [clones remote auction house json locally]
     *
     * @return bool
     */
    public function getInnerAuctionData()
    : bool {
        $innerAuctionURL = $this->getInnerAuctionURL();

        if (!empty($innerAuctionURL)) {
            $json = fopen('../api/' . $this->houseID . '.json', 'wb+');
            $ch   = curl_init();

            curl_setopt_array($ch, [
                CURLOPT_URL            => $innerAuctionURL,
                CURLOPT_FILE           => $json,
                CURLOPT_HTTPHEADER     => 'Authorization: Bearer ' . $this->OAuthAccessToken,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_SSL_VERIFYPEER => true,
            ]);

            curl_exec($ch);

            return fclose($json);
        }

        return false;
    }

    /**
     * @method getRecipeIDs [fetches all recipeIDs dependant on expansionLevel]
     *
     * @param int $professionID [optionally select only profession-related recipes]
     *
     * @return array
     */
    public function getRecipeIDs(int $professionID = 0)
    : array {
        if ($professionID === 0 && empty($this->recipeIDs)) {
            $this->setRecipeIDs();
        } else {
            $this->recipeIDs = [];
            $this->setRecipeIDs($professionID);
        }

        return $this->recipeIDs;
    }

    public function getMaterialIDs()
    : array {
        if (empty($this->materialIDs)) {
            $this->setMaterialIDs();
        }

        return $this->materialIDs;
    }


    /**
     * @method getProfessions [returns private profession array]
     */
    public function getProfessions()
    : array {
        if (empty($this->professions)) {
            $this->setProfessions();
        }

        return $this->professions;
    }

    /**
     * @method getRealms [returns private realm array]
     */
    public function getRealms()
    : array {
        if (empty($this->realms)) {
            $this->setRealms();
        }

        return $this->realms;
    }

    /**
     * @method getOuterAuctionData [fetches remote outer auction data, indicating last update & inner auction url]
     *
     * @return array
     */
    private function getOuterAuctionData()
    : array {

        $outerAuctionURL = $this->getOuterAuctionURL();

        if (!empty($outerAuctionURL)) {

            $curl = curl_init();

            curl_setopt_array($curl, [
                CURLOPT_URL            => $outerAuctionURL,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_SSL_VERIFYPEER => true,
            ]);

            $response = curl_exec($curl);

            curl_close($curl);

            return (array)json_decode($response, true);
        }

        return [];
    }

    /**
     * @method getInnerAuctionURL [fetches inner auction url from database]
     *
     * @return string
     */
    private function getInnerAuctionURL()
    : string {
        $getInnerAuctionURL = $this->connection->prepare('SELECT `auctionURL` FROM `realms` WHERE `houseID` = :houseID LIMIT 1');
        $getInnerAuctionURL->execute(['houseID' => $this->houseID]);

        if ($getInnerAuctionURL->rowCount() > 0) {
            return $getInnerAuctionURL->fetch()['auctionURL'];
        }

        return '';
    }

    /**
     * @method getAuctionsURL [retrieves auctionURL depending on current house]
     *
     * @return string
     */
    private function getOuterAuctionURL()
    : string {
        $getAuctionsURL = $this->connection->prepare('SELECT `region`, `slug` FROM `realms` WHERE `houseID` = :houseID LIMIT 1');

        $getAuctionsURL->execute(['houseID' => $this->houseID]);
        if ($getAuctionsURL->rowCount() > 0) {

            $result = $getAuctionsURL->fetch();

            $region = $result['region'];
            $slug   = $result['slug'];

            return 'https://' . strtolower($region) . '.api.blizzard.com/wow/auction/data/' . $slug . '?access_token=' . $this->OAuthAccessToken;
        }

        return '';
    }

    /**
     * @method getPreviousOAuthData [fetches previously set OAuthData from database]
     *
     * @return array
     */
    private function getPreviousOAuthTokenData()
    : array {
        $getPreviousTokenExpirationTimestamp = $this->connection->query('SELECT * FROM `OAuth`');

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
    public function getExpansionLevels()
    : array {
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
    private function getRecipes(array $professions = []) {

        $storeHouseID = $this->connection->prepare('SET @houseID = :houseID');
        $storeHouseID->execute(['houseID' => $this->houseID]);

        $storeExpansionLevel = $this->connection->prepare('SET @expansionLevel = :expansionLevel');
        $storeExpansionLevel->execute(['expansionLevel' => $this->expansionLevel]);

        $getRecipesQuery = 'SELECT
            `auctionData`.`itemID`,
            `auctionData`.`buyout`,
            `itemNames`.`itemName`,
            `recipes`.`profession`
            FROM `recipes`
            LEFT JOIN `auctionData` ON `auctionData`.`itemID` = `recipes`.`id`
            LEFT JOIN `houseUpdateTracker` ON `houseUpdateTracker`.`houseID` = @houseID
            LEFT JOIN `itemNames` ON `itemNames`.`itemID` = `auctionData`.`itemID`
            WHERE `auctionData`.`houseID` = @houseID
            AND `houseUpdateTracker`.`expansionLevel` = @expansionLevel
            AND `auctionData`.`expansionLevel` = @expansionLevel AND (';

        $queryParams = [];

        $professionCount = count($professions);

        foreach ($professions as $index => $professionID) {
            $getRecipesQuery  .= ' `recipes`.`profession` = :profession' . $index;
            $queryParams['profession' . $index] = $professionID;

            $getRecipesQuery .= array_search($professionID, $professions, true) < $professionCount - 1 ? ' OR' : ')';
        }

        $getCurrentlyAvailableRecipes = $this->connection->prepare($getRecipesQuery);

        $getCurrentlyAvailableRecipes->execute($queryParams);

        return $getCurrentlyAvailableRecipes;
    }

    /**
     * @param array $professions
     *
     * @return array
     */
    public function getProfessionData(array $professions = [])
    : array {

        $this->setCalculationExemptionsIDs();

        $professionTableData = [];

        $recipes = $this->getRecipes($professions);

        if ($recipes->rowCount() > 0) {

            $getConnectedRecipeRequirements = $this->connection->prepare('SELECT
                `requiredItemID` as `itemID`,
                `requiredAmount` as `amount`,
                `itemNames`.`itemName` as `name`,
                `baseBuyPrice`, `producedQuantity`
                FROM `recipeRequirements`
                LEFT JOIN `itemNames` ON `requiredItemID` = `itemNames`.`itemID`
                WHERE `recipe` = :recipeID AND (`rank` = 3 OR `rank` = 0)');

            $getMaterialBuyout = $this->connection->prepare('SELECT `buyout`
                          FROM `auctionData`
                          WHERE `itemID` = :itemID
                          AND `expansionLevel` = :expansionLevel
                          AND `houseID` = :houseID');

            $calculationExemptionItemIDs = array_keys($this->calculationExemptionItemIDs);

            foreach ($recipes->fetchAll() as $recipe) {

                $recipeData = [
                    'product'         => [
                        'item'             => $recipe['itemID'],
                        'name'             => $recipe['itemName'],
                        'buyout'           => $recipe['buyout'],
                        'producedQuantity' => 1,
                    ],
                    'materials'       => [],
                    'materialCostSum' => 0,
                    'profit'          => $recipe['buyout'],
                    'margin'          => 0.00,
                ];

                $getConnectedRecipeRequirements->execute([
                    'recipeID' => $recipe['itemID'],
                ]);

                if ($getConnectedRecipeRequirements->rowCount() > 0) {
                    foreach ($getConnectedRecipeRequirements->fetchAll() as $recipeRequirement) {
                        $recipeData['materials'][] = array_merge($recipeRequirement, ['buyout' => 0]);
                    }
                }

                foreach ($recipeData['materials'] as &$recipeMaterial) {

                    // apply factor of producedQuantity for some recipes (Enchanting, Cooking) beforehand
                    if ((int)$recipeMaterial['producedQuantity'] !== $recipeData['product']['producedQuantity']) {
                        $recipeData['product']['producedQuantity'] = $recipeMaterial['producedQuantity'];
                        $recipeData['profit']                      *= $recipeData['product']['producedQuantity'];
                        $recipeData['product']['buyout']           *= $recipeData['product']['producedQuantity'];
                    }

                    unset($recipeMaterial['producedQuantity']);

                    // filter items that can be bought via vendors or are soulbound
                    if (!in_array((int)$recipeMaterial['itemID'], $calculationExemptionItemIDs, true)) {
                        $getMaterialBuyout->execute([
                            'itemID'         => $recipeMaterial['itemID'],
                            'expansionLevel' => $this->expansionLevel,
                            'houseID'        => $this->houseID,
                        ]);

                        if ($getMaterialBuyout->rowCount() === 1) {
                            $recipeMaterial['buyout'] = $getMaterialBuyout->fetch()['buyout'];

                            $recipeData['profit'] -= $recipeMaterial['buyout'] * $recipeMaterial['amount'];
                        } else {
                            $recipeData['profit'] -= $recipeMaterial['baseBuyPrice'] * $recipeMaterial['amount'];
                        }

                        unset($recipeMaterial['baseBuyPrice']);
                    } else {
                        // subtract vendor prices
                        $recipeMaterial['buyout'] = $this->calculationExemptionItemIDs[$recipeMaterial['itemID']];

                        $recipeData['profit'] -= $recipeMaterial['buyout'] * $recipeMaterial['amount'];
                    }

                    $recipeData['materialCostSum'] += $recipeMaterial['buyout'] * $recipeMaterial['amount'];
                }

                unset($recipeMaterial);

                // reset profit for unlisted recipes
                if($recipeData['product']['buyout'] === 0) {
                    $recipeData['profit'] = 0;
                } elseif($recipeData['materialCostSum'] !== 0) {
                    // avoid division by zero & skip margin for unlisted items
                    $recipeData['margin'] = round(($recipeData['product']['buyout'] / $recipeData['materialCostSum'] - 1) * 100, 2);
                }

                $professionTableData[lcfirst($this->professions[$recipe['profession']])][] = $recipeData;
            }
        }

        ini_set('serialize_precision', -1);

        return $professionTableData;
    }

    /**
     * @return array
     */
    public function getCalculationExemptionItemIDs()
    : array {
        if (empty($this->calculationExemptionItemIDs)) {
            $this->setCalculationExemptionsIDs();
        }

        return $this->calculationExemptionItemIDs;
    }

    /* ---------------------------------------------------------------------------------------------------- */
    // SETTER //

    /**
     *
     */
    private function setMaterialIDs()
    : void {
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
    public function setHouseID(int $houseID = 0)
    : bool {
        if ($this->isValidHouse($houseID)) {
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
    public function setExpansionLevel(int $expansionLevel = 0)
    : bool {
        if ($this->isValidExpansionLevel($expansionLevel)) {
            $this->expansionLevel = $expansionLevel;

            return true;
        }

        return false;
    }

    /**
     * @method setRecipeIDs [fetches recipes depending on current expansionLevel]
     *
     * @param int $professionID
     */
    private function setRecipeIDs(int $professionID = 0)
    : void {
        $params = [
            'expansionLevel' => $this->expansionLevel,
        ];

        if ($professionID === 0) {
            $getRecipeIDsQuery = 'SELECT `id` FROM `recipes` WHERE `expansionLevel` =  :expansionLevel ORDER BY `id` ASC';
        } else {
            $getRecipeIDsQuery    = 'SELECT `id` FROM `recipes` WHERE `expansionLevel` = :expansionLevel AND `profession` = :profession ORDER BY `id` ASC';
            $params['profession'] = $professionID;
        }

        $recipeIDs = $this->connection->prepare($getRecipeIDsQuery);
        $recipeIDs->execute($params);

        if ($recipeIDs->rowCount() > 0) {
            foreach ($recipeIDs->fetchAll() as $dataset) {
                $this->recipeIDs[] = $dataset['id'];
            }
        }
    }

    /**
     * @method setRealms [initializes private realm array]
     */
    private function setRealms()
    : void {
        foreach ($this->regions as $region) {
            $realm = $this->connection->prepare('SELECT `houseID`, `name` FROM `realms` WHERE `region` = :region ORDER BY `name` ASC');
            $realm->execute(['region' => $region]);

            foreach ($realm->fetchAll() as $dataset) {
                $this->realms[$region . '-' . $dataset['name']] = $dataset['houseID'];
            }
        }
    }

    /**
     * @method setProfessions [initializes private profession array]
     */
    private function setProfessions()
    : void {
        $profession = $this->connection->query('SELECT * FROM `professions` ORDER BY `name` ASC');

        foreach ($profession->fetchAll() as $dataset) {
            $this->professions[$dataset['id']] = $dataset['name'];
        }
    }

    /**
     * @method setInnerHouseURL [updates database to allow shortcutting update process the next time]
     *
     * @param string $auctionURL
     */
    private function setInnerHouseURL(string $auctionURL = '')
    : void {
        $setInnerHouseURL = $this->connection->prepare('UPDATE `realms` SET `auctionURL` = :auctionURL WHERE `houseID` = :houseID');
        $setInnerHouseURL->execute([
            'auctionURL' => $auctionURL,
            'houseID'    => $this->houseID,
        ]);
    }

    /**
     * @method setExpansionLevels [fetches expansionLevels from database]
     */
    private function setExpansionLevels()
    : void {
        $setExpansionLevel = $this->connection->query('SELECT * FROM `expansionLevels` ORDER BY `level` ASC');

        foreach ($setExpansionLevel->fetchAll() as $dataset) {
            $this->expansionLevels[$dataset['level']] = $dataset['name'];
        }
    }

    /**
     * @method setCalculationExemptionIDs [extracts IDs of items that can be ignored when parsing data from database]
     */
    private function setCalculationExemptionsIDs()
    : void {
        $getVendorItems = $this->connection->query('SELECT `itemID`, `vendorPrice` FROM `itemCalculationExemptions`');

        foreach ($getVendorItems->fetchAll() as $dataset) {
            $this->calculationExemptionItemIDs[(int)$dataset['itemID']] = (int)$dataset['vendorPrice'];
        }
    }


    /**
     * @method setRecipeRequirements [(re)builds all recipeRequirements for an expansion based upon existing recipes via the WoWDB API]
     *
     * @param array $recipeRequirements
     */
    public function setRecipeRequirements(array $recipeRequirements)
    : void {
        $existingItems = [];

        $getExistingItems = $this->connection->query('SELECT * FROM `itemNames` ORDER BY `itemID` ASC');

        foreach ($getExistingItems->fetchAll() as $item) {
            $existingItems[$item['itemID']] = $item['itemName'];
        }

        $insertRecipe = $this->connection->prepare('INSERT INTO `recipeRequirements` (
                      `recipe`, `requiredItemID`, `requiredAmount`, `rank`, `baseSellPrice`, `baseBuyPrice`, `expansionLevel`, `producedQuantity`) VALUES (
                      :recipeID, :requiredItemID, :requiredAmount, :rank, :baseSellPrice, :baseBuyPrice, :expansionLevel, :producedQuantity)');

        $insertName = $this->connection->prepare('INSERT INTO `itemNames` (`itemID`, `itemName`) VALUES(:itemID, :itemName)');

        $deletePreviousRecipeData = $this->connection->prepare('DELETE FROM `recipeRequirements` WHERE `recipe` = :recipeID AND `requiredItemID` = :requiredItemID AND `rank` = :rank AND `expansionLevel` = :expansionLevel');

        foreach ($recipeRequirements as $recipeRequirement) {
            $requiredItemIDAmount = count($recipeRequirement['requiredItemIDs']);

            for ($i = 0; $i < $requiredItemIDAmount; ++$i) {
                try {

                    if (!array_key_exists($recipeRequirement['requiredItemIDs'][$i], $existingItems)) {
                        $insertName->execute([
                            'itemID'   => $recipeRequirement['requiredItemIDs'][$i],
                            'itemName' => $recipeRequirement['itemNames'][$i],
                        ]);
                    }

                    $deletePreviousRecipeData->execute([
                        'recipeID'       => $recipeRequirement['recipeID'],
                        'requiredItemID' => $recipeRequirement['requiredItemIDs'][$i],
                        'rank'           => $recipeRequirement['rank'],
                        'expansionLevel' => $this->expansionLevel,
                    ]);

                    $insertRecipe->execute([
                        'recipeID'         => $recipeRequirement['recipeID'],
                        'requiredItemID'   => $recipeRequirement['requiredItemIDs'][$i],
                        'requiredAmount'   => $recipeRequirement['requiredAmounts'][$i],
                        'rank'             => $recipeRequirement['rank'],
                        'baseSellPrice'    => $recipeRequirement['baseSellPrices'][$i],
                        'baseBuyPrice'     => $recipeRequirement['baseBuyPrices'][$i],
                        'expansionLevel'   => $this->expansionLevel,
                        'producedQuantity' => $recipeRequirement['producedQuantity'],
                    ]);
                } catch (PDOException $exception) {
                    print_r($exception->getMessage());
                    die;
                }
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
     * @return int
     */
    public function validateRegionRealm(string $region = '', string $realm = '')
    : array {

        if (in_array(strtoupper($region), $this->regions, true)) {

            $validation = $this->connection->prepare('SELECT `houseID`, `updateInterval` FROM `realms` WHERE `region` = :region AND `name` = :name');
            $validation->execute([
                'region' => $region,
                'name'   => $realm,
            ]);

            if ($validation->rowCount() > 0) {
                $result = $validation->fetch();

                return [$result['houseID'], $result['updateInterval']];
            }
        }

        return [0, 0];
    }

    /**
     * @method setHouseTimestamp [updates timestamp of last house validation]
     *
     * @param int $timestamp [milliseconds]
     */
    private function setHouseTimestamp(int $timestamp = 0)
    : void {
        $queryParams = [
            'houseID'        => $this->houseID,
            'expansionLevel' => $this->expansionLevel,
        ];

        $deletePreviousHouseUpdate = $this->connection->prepare('DELETE FROM `houseUpdateTracker` WHERE `houseID` = :houseID AND `expansionLevel` = :expansionLevel');
        $deletePreviousHouseUpdate->execute($queryParams);

        $insertHouseUpdate = $this->connection->prepare('INSERT INTO `houseUpdateTracker` (`houseID`, `expansionLevel`, `timestamp`) VALUES(:houseID, :expansionLevel, :timestamp)');

        $queryParams['timestamp'] = $timestamp;

        $insertHouseUpdate->execute($queryParams);
    }

    /**
     * @method isHouseOutdated [checks whether a house has new external data available to be fetched]
     *
     * @return array
     */
    public function isHouseOutdated()
    : array {

        $getLastUpdateTimestamp = $this->connection->prepare('SELECT `timestamp` FROM `houseUpdateTracker` WHERE `houseID` = :houseID AND `expansionLevel` = :expansionLevel');
        $getLastUpdateTimestamp->execute([
            'houseID'        => $this->houseID,
            'expansionLevel' => $this->expansionLevel,
        ]);

        // assume house has never been fetched before
        $houseRequiresUpdate = true;
        $lastUpdateTimestamp = 0;

        // house has been previously fetched, check whether it needs an update
        if ($getLastUpdateTimestamp->rowCount() === 1) {
            $lastUpdateTimestamp = $getLastUpdateTimestamp->fetch()['timestamp'];
        }

        $outerAuctionData = $this->getOuterAuctionData();

        if (!empty($outerAuctionData)) {

            $this->setInnerHouseURL($outerAuctionData['files'][0]['url']);

            // AH technically is older than N minutes, but API servers haven't updated yet
            if ($outerAuctionData['files'][0]['lastModified'] <= $lastUpdateTimestamp) {
                $houseRequiresUpdate = false;
            }

            $lastUpdateTimestamp = $outerAuctionData['files'][0]['lastModified'];

            return [
                'callback'   => $houseRequiresUpdate ? 'houseRequiresUpdate' : 'getProfessionTables',
                'lastUpdate' => $lastUpdateTimestamp,
            ];
        }

        return [
            'callback'   => 'throwHouseUnavailabilityError',
            'lastUpdate' => 0,
        ];
    }

    /**
     * @method updateHouse [updates current house based on given recipeIDs and expansionLevel]
     *
     * @param array $recipeIDs
     */
    public function updateHouse(array $recipeIDs = [])
    : void {

        $removePreviousData = $this->connection->prepare('DELETE FROM `auctionData` WHERE `houseID` = :houseID AND `expansionLevel` = :expansionLevel');
        $removePreviousData->execute([
            'houseID'        => $this->houseID,
            'expansionLevel' => $this->expansionLevel,
        ]);

        $insertHouseData = $this->connection->prepare('INSERT INTO `auctionData` (`houseID`, `itemID`, `buyout`, `expansionLevel`) VALUES (:houseID, :itemID, :buyout, :expansionLevel)');

        foreach ($recipeIDs as $itemID => $buyout) {
            $insertHouseData->execute([
                'houseID'        => $this->houseID,
                'itemID'         => $itemID,
                'buyout'         => $buyout,
                'expansionLevel' => $this->expansionLevel,
            ]);
        }

        $outerAuctionData = $this->getOuterAuctionData();

        if (!empty($outerAuctionData)) {
            $this->setHouseTimestamp($outerAuctionData['files'][0]['lastModified']);
        }
    }

    /**
     * @method updateOAuthAccessToken [updates database to reflect new OAuthAccessToken]
     * @param string $token
     * @param int    $remainingTime
     */
    private function updateOAuthAccessToken(string $token = '', int $remainingTime = 0)
    : void {
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
     * @return array
     */
    public function areValidProfessions(array $professionIDs = [])
    : array {
        if (empty($this->professions)) {
            $this->setProfessions();
        }

        $validProfessions = array_keys($this->professions);

        foreach ($professionIDs as $professionID) {
            $professionID = (int)$professionID;
            if (!in_array($professionID, $validProfessions, true)) {
                array_splice($professionIDs, array_search($professionID, $professionIDs, true), 1);
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
     * @return int
     */
    public function isValidExpansionLevel(int $expansionLevel = 8)
    : int {
        if (empty($this->expansionLevels)) {
            $this->setExpansionLevels();
        }

        if (!array_key_exists($expansionLevel, $this->expansionLevels)) {
            return 8;
        }

        return $expansionLevel;
    }

    /**
     * @param string $data [current auction JSON snipped that hopefully is an array]
     */
    public function validateAuctionRelevance(string $data = '') {
        global $itemIDs;

        $auction = json_decode($data, true);

        if ($auction !== NULL && isset($itemIDs[$auction['item']])) {

            $thisPPU = (int)round($auction['buyout'] / $auction['quantity']);

            $previousPPU = (int)$itemIDs[$auction['item']];

            if ($previousPPU === 0 || ($thisPPU < $previousPPU && $thisPPU !== 0)) {
                $itemIDs[$auction['item']] = $thisPPU;
            }
        }
    }
}
