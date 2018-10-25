<?php

ini_set('max_execution_time', 60);

require_once '../dependencies/headers.php';
require_once '../dependencies/class.AuctionCraftSniper.php';

$AuctionCraftSniper = new AuctionCraftSniper(false, [1, 2, 3, 4, 5, 6, 7, 8, 9]);

$itemIDs = $AuctionCraftSniper->getItemIDs();


function jsLog(...$vars) {
    echo '<script>console.log(' . json_encode($vars) . ');</script>';
}


$auctionValues    = [];
$fileSize         = filesize('blackmoore.json');
$byteLimit        = 365;

$auctionEndString = ',{"auc"';
$leftovers        = '';

if ($stream = fopen('blackmoore.json', 'r')) {

    $first200Bytes = stream_get_contents($stream, 200, 0);
    $auctionsStart = strpos($first200Bytes, '"auctions": [') + 16;

    for ($bytes = $auctionsStart; $bytes <= 4000000; $bytes += $byteLimit) {

        // get trailing auction data from previous iteration to have a full new dataset
        $data = $leftovers;

        // remove whitespace & linebreaks
        $data .= str_replace("	", '', str_replace("\r\n", '', stream_get_contents($stream, $byteLimit, $bytes)));

        // find end of this auction
        $auctionEnd = strpos($data, $auctionEndString);

        // define new leftovers for next iteration, +1 because of leading , at start of new auction obj
        $leftovers = substr($data, $auctionEnd + 1);

        $data = json_decode(substr($data, 0, $auctionEnd), true);

        if (in_array($data['item'], $itemIDs)) {
            $thisPPU     = round($data['buyout'] / $data['quantity']);
            $previousPPU = (int)$auctionValues[$data['item']];

            if ($previousPPU === 0 || $thisPPU < $previousPPU) {
                $auctionValues[$data['item']] = $thisPPU;
            }
        }
    }

    fclose($stream);

    echo json_encode($auctionValues);
}
