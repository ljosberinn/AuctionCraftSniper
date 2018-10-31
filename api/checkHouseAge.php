<?php

$response = ['callback' => 'throwHouseUnavailabilityError'];

if (isset($_GET['house']) && is_numeric ($_GET['house']) && isset($_GET['expansionLevel']) && is_numeric ($_GET['expansionLevel'])) {

    require_once '../dependencies/headers.php';
    require_once '../dependencies/class.AuctionCraftSniper.php';

    $AuctionCraftSniper = new AuctionCraftSniper();

    $houseID        = $AuctionCraftSniper->isValidHouse ((int) $_GET['house']);
    $expansionLevel = $AuctionCraftSniper->isValidExpansionLevel ((int) $_GET['house']);

    if ($houseID && $expansionLevel) {
        $response = ['callback' => $AuctionCraftSniper->isHouseOutdated ($houseID, $expansionLevel) ? 'houseRequiresUpdate' : 'getProfessionTables'];
    }
}

echo json_encode ($response);
