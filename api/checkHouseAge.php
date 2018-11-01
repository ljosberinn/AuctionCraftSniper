<?php

require_once '../dependencies/headers.php';

$response = ['callback' => 'throwHouseUnavailabilityError'];

if (isset($_GET['houseID']) && is_numeric($_GET['houseID']) && isset($_GET['expansionLevel']) && is_numeric($_GET['expansionLevel'])) {

    require_once '../dependencies/class.AuctionCraftSniper.php';

    $AuctionCraftSniper = new AuctionCraftSniper();

    $AuctionCraftSniper->setHouseID($_GET['houseID']);
    $AuctionCraftSniper->setExpansionLevel($_GET['expansionLevel']);

    $response['callback'] = $AuctionCraftSniper->isHouseOutdated() ? 'houseRequiresUpdate' : 'getProfessionTables';
}

echo json_encode($response);
