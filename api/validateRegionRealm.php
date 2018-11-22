<?php

require_once '../dependencies/headers.php';

$response = ['houseID' => 0];

if (isset($_GET['region'], $_GET['realm']) && !is_numeric($_GET['region']) && !is_numeric($_GET['realm'])) {

    $region = (string)$_GET['region'];
    $realm  = (string)$_GET['realm'];

    require_once '../dependencies/class.AuctionCraftSniper.php';

    $houseID = (new AuctionCraftSniper())->validateRegionRealm($region, $realm);

    if ($houseID) {
        $response['houseID'] = $houseID;
    }
}

echo json_encode($response, JSON_NUMERIC_CHECK);
