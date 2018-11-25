<?php

$response = ['callback' => 'throwHouseUnavailabilityError'];

if (isset($_GET['houseID'], $_GET['professions'], $_GET['expansionLevel']) && is_numeric($_GET['houseID']) && is_numeric($_GET['expansionLevel'])) {

    require_once '../dependencies/headers.php';
    require_once '../dependencies/class.AuctionCraftSniper.php';

    $AuctionCraftSniper = new AuctionCraftSniper();

    $AuctionCraftSniper->setExpansionLevel($_GET['expansionLevel']);
    $AuctionCraftSniper->setHouseID($_GET['houseID']);

    $professions = $AuctionCraftSniper->AreValidProfessions(explode(',', $_GET['professions']));

    if ($professions) {
        $response = $AuctionCraftSniper->getProfessionData($professions);
    }
}

echo json_encode($response, JSON_NUMERIC_CHECK);
