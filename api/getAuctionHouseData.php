<?php

$response = ['callback' => 'throwHouseUnavailabilityError'];

if (isset($_GET['house']) && is_numeric ($_GET['house'])) {

    require_once '../dependencies/headers.php';
    require_once '../dependencies/class.AuctionCraftSniper.php';

    $AuctionCraftSniper = new AuctionCraftSniper();

    $house = $AuctionCraftSniper->isValidHouse ((int) $_GET['house']);

    if ($house) {

        $url = $AuctionCraftSniper->getInnerAuctionURL ($house);

        $json = fopen ($house . '.json', 'w+');
        $ch   = curl_init ($url);

        curl_setopt_array ($ch, [
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_FILE           => $json,
            CURLOPT_HTTPHEADER     => 'Authorization: Bearer ' . $AuctionCraftSniper->getOAuthAccessToken (),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        curl_exec ($ch);

        $successfulCopy = fclose ($json);

        $response = ['callback' => $successfulCopy ? 'parseAuctionData' : 'throwHouseUnavailabilityError'];
    }
}

echo json_encode ($response);
