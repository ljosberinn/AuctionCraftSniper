<?php

header('Content-Type: application/json');

$response = [
    'callback'   => 'throwHouseUnavailabilityError',
    'lastUpdate' => 0,
];

if (isset($_GET['houseID'], $_GET['expansionLevel']) && is_numeric($_GET['houseID']) && is_numeric($_GET['expansionLevel'])) {

    require '../dependencies/class.AuctionCraftSniper.php';

    $AuctionCraftSniper = new AuctionCraftSniper();

    $AuctionCraftSniper->setHouseID((int) $_GET['houseID']);
    $AuctionCraftSniper->setExpansionLevel($_GET['expansionLevel']);

    $response = $AuctionCraftSniper->isHouseOutdated();
}

echo json_encode($response);
