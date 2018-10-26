<?php

if (isset($_GET['house']) && is_numeric($_GET['house'])) {

    $house = (int)$_GET['house'];

    if ($house !== 0) {

        require_once '../dependencies/headers.php';
        require_once '../dependencies/class.AuctionCraftSniper.php';

        $AuctionCraftSniper = new AuctionCraftSniper();
        $url = $AuctionCraftSniper->getAuctionsURL($house);

        #$successfulCopy = copy($url, $house . '.json');
        $successfulCopy = true;

        echo json_encode(['callback' => $successfulCopy ? 'parseAuctionData' : 'throwUnavailabilityError']);
    }
}
