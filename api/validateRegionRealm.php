<?php

if (isset($_GET['region']) && isset($_GET['realm'])) {

    $region = (string)$_GET['region'];
    $realm  = (string)$_GET['realm'];

    require_once '../dependencies/headers.php';
    require_once '../dependencies/class.AuctionCraftSniper.php';

    echo json_encode(['house' => (new AuctionCraftSniper())->validateRegionRealm($region, $realm)], JSON_NUMERIC_CHECK);
}
