<?php

$response = ['callback' => 'throwHouseUnavailabilityError'];

if (isset($_GET['house']) && is_numeric($_GET['house']) && isset($_GET['expansionLevel']) && is_numeric($_GET['expansionLevel'])) {

    require_once '../dependencies/headers.php';
    require_once '../dependencies/class.AuctionCraftSniper.php';

    $houseID        = (int)$_GET['house'];
    $expansionLevel = (int)$_GET['expansionLevel'];

    if ($houseID !== 0 && $expansionLevel !== 0) {

        $AuctionCraftSniper = new AuctionCraftSniper();

        $response = ['callback' => $AuctionCraftSniper->isHouseOutdated($houseID, $expansionLevel) ? 'houseRequiresUpdate' : 'getProfessionTables'];
    }
}

echo json_encode($response);
