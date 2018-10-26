<?php

function jsLog(...$vars) {
    echo '<script>console.log(' . json_encode($vars) . ');</script>';
}

require_once '../dependencies/headers.php';

const CHUNK_SIZE         = 2700000;
const AUCTION_END_STRING = ',{"auc"';
const BYTE_LIMIT         = 365;

if (!isset($_POST['step']) && !isset($_POST['auctionValues']) && !isset($_POST['itemIDs'])) {

    require_once '../dependencies/class.AuctionCraftSniper.php';

    $AuctionCraftSniper = new AuctionCraftSniper(false, [1, 2, 3, 4, 5, 6, 7, 8, 9]);

    $itemIDs = $auctionValues = [];

    foreach ($AuctionCraftSniper->getItemIDs() as $itemID) {
        $itemIDs[$itemID] = true;
    }

    $step = 1;
} else {
    $auctionValues = (array)json_decode($_POST['auctionValues']);
    $itemIDs       = (array)json_decode($_POST['itemIDs']);
    $step          = (int)$_POST['step'];

    if ($step <= 1) {
        echo json_encode(['err' => 'invalid step specified']);
        die;
    }
}

$fileName = (int)$_POST['houseID'];
#$fileName = 'blackmoore.json';

if ($fileName === 0) {
    echo json_encode(['err' => 'invalid house specified']);
    die;
}

if ($stream = fopen($fileName, 'r')) {

    if (!isset($_POST['step'])) {
        $first200Bytes = stream_get_contents($stream, 200, 0);
        $auctionsStart = strpos($first200Bytes, '"auctions": [') + 16;

        $nextChunkEnd = CHUNK_SIZE;
    } else {
        $nextChunkEnd  = CHUNK_SIZE * $step;
        $auctionsStart = $nextChunkEnd - CHUNK_SIZE;
    }

    $fileSize  = filesize($fileName);
    $leftovers = '';

    if ($nextChunkEnd > $fileSize) {
        $nextChunkEnd = $fileSize;
    }

    for ($bytes = $auctionsStart; $bytes <= $nextChunkEnd; $bytes += BYTE_LIMIT) {

        // get trailing auction data from previous iteration to have a full new dataset
        $data = $leftovers;

        // remove whitespace & linebreaks
        $data .= str_replace("	", '', str_replace("\r\n", '', stream_get_contents($stream, BYTE_LIMIT, $bytes)));

        // find end of this auction
        $auctionEnd = strpos($data, AUCTION_END_STRING);

        // define new leftovers for next iteration, +1 because of leading , at start of new auction obj
        $leftovers = substr($data, $auctionEnd + 1);

        $data = json_decode(substr($data, 0, $auctionEnd), true);

        if (isset($itemIDs[$data['item']])) {
            $thisPPU     = round($data['buyout'] / $data['quantity']);
            $previousPPU = (int)$auctionValues[$data['item']];

            if ($previousPPU === 0 || $thisPPU < $previousPPU) {
                $auctionValues[$data['item']] = $thisPPU;
            }
        }
    }

    fclose($stream);

    $response = [
        'auctionValues' => $auctionValues,
        'itemIDs'       => $itemIDs,
        'step'          => $nextChunkEnd === $fileSize ? -1 : $step + 1,
    ];

    echo json_encode($response);
}
