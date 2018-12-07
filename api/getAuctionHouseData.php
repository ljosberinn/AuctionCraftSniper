<?php

require '../dependencies/headers.php';

$response = ['callback' => 'throwHouseUnavailabilityError'];

if (isset($_GET['houseID']) && is_numeric($_GET['houseID'])) {

    require '../dependencies/class.AuctionCraftSniper.php';

    $AuctionCraftSniper = new AuctionCraftSniper();
    $AuctionCraftSniper->setHouseID($_GET['houseID']);

    $response = ['callback' => $AuctionCraftSniper->getInnerAuctionData() ? 'parseAuctionData' : 'throwHouseUnavailabilityError'];
}

echo json_encode($response);
