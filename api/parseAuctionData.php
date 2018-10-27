<?php

require_once '../dependencies/headers.php';
require_once '../dependencies/class.AuctionCraftSniper.php';

$decodedPOST = json_decode(trim(file_get_contents("php://input")), true);

const BYTE_LIMIT = 365;
const CHUNK_SIZE = 2568505;

if (!isset($decodedPOST['step']) && empty($decodedPOST['auctionValues']) && empty($decodedPOST['itemIDs'])) {

    $AuctionCraftSniper = new AuctionCraftSniper();

    $itemIDs       = $AuctionCraftSniper->getItemIDs();
    $auctionValues = [];
    $step          = 0;

} else {

    $auctionValues = (array)$decodedPOST['auctionValues'];
    $itemIDs       = (array)$decodedPOST['itemIDs'];
    $step          = (int)$decodedPOST['step'];

    if ($step < 1) {
        echo json_encode(['err' => 'invalid step specified']);
        die;
    }
}

$fileName = (int)$decodedPOST['house'] . '.json';

if ($fileName === 0) {
    echo json_encode(['err' => 'invalid house specified']);
    die;
}

if (file_exists($fileName) && $stream = fopen($fileName, 'r')) {

    if (!isset($decodedPOST['step'])) {
        $first200Bytes = stream_get_contents($stream, 200, 0);
        $auctionsStart = strpos($first200Bytes, '"auctions": [') + 16;

        $thisChunksEnd = CHUNK_SIZE;
    } else {
        $thisChunksEnd = CHUNK_SIZE * ($step + 1);
        $auctionsStart = $thisChunksEnd - CHUNK_SIZE;
    }

    $fileSize = filesize($fileName);

    $auctionEndString = ',{"auc"';

    if ($thisChunksEnd > $fileSize) {
        $thisChunksEnd    = $fileSize;
        $auctionEndString = ']}';
    }

    $leftovers = '';

    for ($bytes = $auctionsStart; $bytes <= $thisChunksEnd; $bytes += BYTE_LIMIT) {

        // get trailing auction data from previous iteration to have a full new dataset
        $data = $leftovers;

        // remove whitespace & linebreaks
        $data .= str_replace("	", '', str_replace("\r\n", '', stream_get_contents($stream, BYTE_LIMIT, $bytes)));

        // find end of this auction
        $auctionEnd = strpos($data, $auctionEndString);

        // define new leftovers for next iteration, +1 because of leading , at start of new auction obj
        $leftovers = substr($data, $auctionEnd + 1);

        $data = json_decode(substr($data, 0, $auctionEnd), true);

        if (in_array($data['item'], $itemIDs)) {
            $thisPPU = round($data['buyout'] / $data['quantity']);

            $previousPPU = (int)$auctionValues[$data['item']];

            if ($previousPPU === 0 || $thisPPU < $previousPPU && $thisPPU !== 0) {
                $auctionValues[$data['item']] = $thisPPU;
            }
        }
    }

    fclose($stream);

    $updaterQuery = '';

    $response = [
        'auctionValues' => $auctionValues,
        'itemIDs'       => $itemIDs,
        'step'          => $step + 1,
        'reqSteps'      => ceil($fileSize / CHUNK_SIZE),
        'percentDone'   => round(($thisChunksEnd / $fileSize) * 100, 2),
    ];

    if ((int)$response['step'] === (int)$response['reqSteps']) {
        $AuctionCraftSniper   = new AuctionCraftSniper();
        $updaterQuery         = $AuctionCraftSniper->updateHouse($decodedPOST['house'], $auctionValues);
        $response['callback'] = 'getProfessionTables';
        unlink($fileName);
    }

    echo json_encode($response);
}

