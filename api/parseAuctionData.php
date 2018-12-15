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

$AuctionCraftSniper = new AuctionCraftSniper();

$expansionLevel       = $AuctionCraftSniper->isValidExpansionLevel($decodedPOST['expansionLevel']);
$calculationExemption = $AuctionCraftSniper->getCalculationExemptionItemIDs();

$AuctionCraftSniper->setHouseID($decodedPOST['houseID']);
$AuctionCraftSniper->setExpansionLevel($expansionLevel);

$itemIDs = [];

foreach (array_merge($AuctionCraftSniper->getRecipeIDs(), $AuctionCraftSniper->getMaterialIDs()) as $id) {
    if (!array_key_exists($id, $calculationExemption)) {
        $itemIDs[$id] = 0;
    }
}

$step = 0;

$fileName = (int)$decodedPOST['houseID'] . '.json';

if ($fileName === '0.json') {
    echo json_encode(['err' => 'invalid house specified']);
    die;
}

if (file_exists($fileName) && $stream = fopen($fileName, 'rb')) {

    $fileSize         = filesize($fileName);
    $auctionEndString = ',{"auc"';

    $first500Bytes = stream_get_contents($stream, 500, 0);
    $auctionsStart = strpos($first500Bytes, '"auctions": [') + 16;

    $leftovers = '';

    for ($bytes = $auctionsStart; $bytes <= $fileSize; $bytes += BYTE_LIMIT) {

        // reduce leftovers if it contains more than 10 auctions
        if (substr_count($leftovers, $auctionEndString) > 10) {
            while (strpos($leftovers, $auctionEndString) !== false) {
                // find end of this auction
                $auctionEnd = strpos($leftovers, $auctionEndString);

                $AuctionCraftSniper->validateAuctionRelevance(substr($leftovers, 0, $auctionEnd));

                // define new leftovers for next iteration, +1 because of leading , at start of new auction obj
                $leftovers = substr($leftovers, $auctionEnd + 1);
            }
        }

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

        $AuctionCraftSniper->validateAuctionRelevance(substr($data, 0, $auctionEnd));
    }

    fclose($stream);

    $AuctionCraftSniper->updateHouse($itemIDs);

    unlink($fileName);

    echo json_encode([
        'callback' => 'getProfessionTables',
    ]);
}
