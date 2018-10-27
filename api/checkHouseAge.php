<?php

$response = ['callback' => 'throwHouseUnavailabilityError'];

if (isset($_GET['house']) && is_numeric($_GET['house'])) {
    require_once '../dependencies/headers.php';
    require_once '../dependencies/class.AuctionCraftSniper.php';

    $houseID = (int)$_GET['house'];

    if ($houseID !== 0) {

        $AuctionCraftSniper = new AuctionCraftSniper();

        $response = ['callback' => $AuctionCraftSniper->isHouseOutdated($houseID) ? 'houseRequiresUpdate' : 'getProfessionTables'];
    }
}

echo json_encode($response);
