<?php

require '../dependencies/headers.php';

$response = ['houseID' => 0];

if (isset($_GET['region'], $_GET['realm']) && !is_numeric($_GET['region']) && !is_numeric($_GET['realm'])) {

    require '../dependencies/class.AuctionCraftSniper.php';

    [$houseID, $updateInterval] = (new AuctionCraftSniper())->validateRegionRealm((string) $_GET['region'], (string) $_GET['realm']);

    if ($houseID !== 0) {
        $response['houseID']        = $houseID;
        $response['updateInterval'] = $updateInterval;
    }
}

echo json_encode($response, JSON_NUMERIC_CHECK);
