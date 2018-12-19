<?php

header('Content-Type: application/json');

$response = ['callback' => 'throwHouseUnavailabilityError'];

if (isset($_GET['houseID']) && is_numeric($_GET['houseID'])) {

    require '../dependencies/class.AuctionCraftSniper.php';

    $AuctionCraftSniper = new AuctionCraftSniper();
    $AuctionCraftSniper->setHouseID((int)$_GET['houseID']);

    if (!file_exists($_GET['houseID'] . '.json')) {
        $response['callback'] = $AuctionCraftSniper->getInnerAuctionData() ? 'parseAuctionData' : 'throwHouseUnavailabilityError';
    } else {
        $response['callback'] = 'waitForParseTimeout';
    }
}

echo json_encode($response);
