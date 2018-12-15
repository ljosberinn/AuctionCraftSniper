<?php

header('Content-Type: application/json');
require '../dependencies/class.AuctionCraftSniper.php';

$decodedPOST = json_decode(trim(file_get_contents('php://input')), true);

if (!isset($decodedPOST)) {
    header('Location: ../index.php');
}

/* maximum length of one auction JSON
 * realm: Culte de la Rive noire
 * character name length: 12
 * bid & buyout: 9.999.999 in copper
 * remaining time: VERY_LONG
 * itemID length: 6
 * quantity: 200
 */
const BYTE_LIMIT = 387;
const CHUNK_SIZE = 2087091; // 5393 * BYTE_LIMIT iterations per second

if (!isset($decodedPOST['step']) && empty($decodedPOST['itemIDs'])) {

    $AuctionCraftSniper = new AuctionCraftSniper();
    $expansionLevel     = $AuctionCraftSniper->isValidExpansionLevel($decodedPOST['expansionLevel']);
    $AuctionCraftSniper->setExpansionLevel($expansionLevel);

    $itemIDs              = [];
    $calculationExemption = $AuctionCraftSniper->getCalculationExemptionItemIDs();

    foreach (array_merge($AuctionCraftSniper->getRecipeIDs(), $AuctionCraftSniper->getMaterialIDs()) as $id) {
        if (!array_key_exists($id, $calculationExemption)) {
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

$fileSize         = filesize($fileName);
$auctionEndString = ',{"auc"';

if (file_exists($fileName) && $stream = fopen($fileName, 'rb')) {

    if (!isset($decodedPOST['step'])) {
        $first500Bytes = stream_get_contents($stream, 500, 0);
        $auctionsStart = strpos($first500Bytes, '"auctions": [') + 16;

        $thisChunksEnd = CHUNK_SIZE;
    } else {
        $thisChunksEnd = CHUNK_SIZE * ($step + 1);
        $auctionsStart = $thisChunksEnd - CHUNK_SIZE - BYTE_LIMIT;
    }

    // prevent fetching more bytes than available
    if ($thisChunksEnd > $fileSize) {
        $thisChunksEnd = $fileSize;
    }

    $leftovers = '';

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

        if ($data !== NULL && isset($itemIDs[$data['item']])) {
            $thisPPU = (int)round($data['buyout'] / $data['quantity']);

            $previousPPU = (int)$itemIDs[$data['item']];

            if ($previousPPU === 0 || ($thisPPU < $previousPPU && $thisPPU !== 0)) {
                $itemIDs[$data['item']] = $thisPPU;
            }
        }
    }


    fclose($stream);

    $auctionEndString = ',{"auc"';

    while (strlen($leftovers) > 0) {
        $auctionEnd = strpos($leftovers, $auctionEndString);

        $currentAuction = substr($leftovers, 0, $auctionEnd);

        $leftovers = substr($leftovers, $auctionEnd + 1);

        $data = json_decode($currentAuction, true);

        if ($data !== NULL && isset($itemIDs[$data['item']])) {
            $thisPPU = (int)round($data['buyout'] / $data['quantity']);

            $previousPPU = (int)$itemIDs[$data['item']];

            if ($previousPPU === 0 || ($thisPPU < $previousPPU && $thisPPU !== 0)) {
                $itemIDs[$data['item']] = $thisPPU;
            }
        }
    }

    $response = [
        'itemIDs'        => $itemIDs,
        'expansionLevel' => $expansionLevel,
        'step'           => $step + 1,
        'reqSteps'       => (int)ceil($fileSize / CHUNK_SIZE),
        'percentDone'    => round(($thisChunksEnd / $fileSize) * 100, 2),
    ];

    ini_set('serialize_precision', 2);

    if ($response['step'] === $response['reqSteps']) {
        $AuctionCraftSniper = new AuctionCraftSniper();
        $AuctionCraftSniper->setHouseID($decodedPOST['houseID']);
        $AuctionCraftSniper->setExpansionLevel($expansionLevel);

        $AuctionCraftSniper->updateHouse($itemIDs);

        $response['callback'] = 'getProfessionTables';
        unlink($fileName);
    }

    echo json_encode($response);
}

