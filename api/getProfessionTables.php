<?php

require '../dependencies/headers.php';

$response = ['callback' => 'throwHouseUnavailabilityError'];

if (isset($_GET['houseID'], $_GET['professions'], $_GET['expansionLevel']) && is_numeric($_GET['houseID']) && is_numeric($_GET['expansionLevel'])) {

    require '../dependencies/class.AuctionCraftSniper.php';

    $AuctionCraftSniper = new AuctionCraftSniper();

    $AuctionCraftSniper->setExpansionLevel((int)$_GET['expansionLevel']);
    $AuctionCraftSniper->setHouseID((int)$_GET['houseID']);

    $professions = $AuctionCraftSniper->areValidProfessions(explode(',', $_GET['professions']));

    $response = $AuctionCraftSniper->getProfessionData($professions);
}

echo json_encode($response, JSON_NUMERIC_CHECK);
