<?php

require_once '../dependencies/headers.php';
require_once '../dependencies/class.AuctionCraftSniper.php';

$decodedPOST = json_decode(trim(file_get_contents('php://input')), true);

const BYTE_LIMIT = 365;
const CHUNK_SIZE = 2568505;

if (!isset($decodedPOST['step']) && empty($decodedPOST['itemIDs'])) {

    $AuctionCraftSniper = new AuctionCraftSniper();
    $AuctionCraftSniper->setExpansionLevel($decodedPOST['expansionLevel']);
    $expansionLevel = $AuctionCraftSniper->isValidExpansionLevel($decodedPOST['expansionLevel']);

    $itemIDs              = [];
    $calculationExemption = $AuctionCraftSniper->getCalculationExemptionItemIDs();

    foreach (array_merge($AuctionCraftSniper->getRecipeIDs(), $AuctionCraftSniper->getMaterialIDs()) as $id) {
        if (!in_array($id, $calculationExemption)) {
            $itemIDs[$id] = 0;
        }
    }

    $step = 0;

} else {

    $itemIDs        = (array)$decodedPOST['itemIDs'];
    $step           = (int)$decodedPOST['step'];
    $expansionLevel = (int)$decodedPOST['expansionLevel'];

    if ($step < 1) {
        echo json_encode(['err' => 'invalid step specified']);
        die;
    }
}

$fileName = (int)$decodedPOST['houseID'] . '.json';

if ($fileName === '0.json') {
    echo json_encode(['err' => 'invalid house specified']);
    die;
}

if (file_exists($fileName) && $stream = fopen($fileName, 'rb')) {

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

    // prevent fetching more bytes than available
    if ($thisChunksEnd > $fileSize) {
        $thisChunksEnd = $fileSize;
    }

    $leftovers = '';

    $itemKeys = array_keys($itemIDs);

    for ($bytes = $auctionsStart; $bytes <= $thisChunksEnd; $bytes += BYTE_LIMIT) {

        // get trailing auction data from previous iteration to have a full new dataset
        $data = $leftovers;

        // remove whitespace & linebreaks
        $data .= str_replace('	', '', str_replace("\r\n", '', stream_get_contents($stream, BYTE_LIMIT, $bytes)));

        // switch $auctionEndString since the very last auction obviously has no object following
        if ($bytes + BYTE_LIMIT >= $fileSize) {
            $auctionEndString = ']}';
        }

        // find end of this auction
        $auctionEnd = strpos($data, $auctionEndString);

        // define new leftovers for next iteration, +1 because of leading , at start of new auction obj
        $leftovers = substr($data, $auctionEnd + 1);

        $data = json_decode(substr($data, 0, $auctionEnd), true);

        if (in_array($data['item'], $itemKeys)) {
            $thisPPU = round($data['buyout'] / $data['quantity']);

            $previousPPU = (int)$itemIDs[$data['item']];

            if ($previousPPU === 0 || $thisPPU < $previousPPU && $thisPPU !== 0) {
                $itemIDs[$data['item']] = $thisPPU;
            }
        }
    }

    fclose($stream);

    $response = [
        'itemIDs'        => $itemIDs,
        'expansionLevel' => $expansionLevel,
        'step'           => $step + 1,
        'reqSteps'       => ceil($fileSize / CHUNK_SIZE),
        'percentDone'    => round(($thisChunksEnd / $fileSize) * 100, 2),
    ];

    if ((int)$response['step'] === (int)$response['reqSteps']) {
        $AuctionCraftSniper = new AuctionCraftSniper();
        $AuctionCraftSniper->setHouseID($decodedPOST['houseID']);
        $AuctionCraftSniper->setExpansionLevel($expansionLevel);

        $AuctionCraftSniper->updateHouse($itemIDs);

        $response['callback'] = 'getProfessionTables';
        unlink($fileName);
    }

    echo json_encode($response);
}

