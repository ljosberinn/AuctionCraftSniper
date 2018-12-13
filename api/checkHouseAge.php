<?php

header('Content-Type: application/json');

$response = [
    'callback'   => 'throwHouseUnavailabilityError',
    'lastUpdate' => 0,
];

if (isset($_GET['houseID'], $_GET['expansionLevel']) && is_numeric($_GET['houseID']) && is_numeric($_GET['expansionLevel'])) {

    require '../dependencies/class.AuctionCraftSniper.php';

    $AuctionCraftSniper = new AuctionCraftSniper();

    $AuctionCraftSniper->setHouseID((int)$_GET['houseID']);
    $AuctionCraftSniper->setExpansionLevel($_GET['expansionLevel']);

    $response = $AuctionCraftSniper->isHouseOutdated();

    // if house has been updated before
    if ($response['lastUpdate'] > 0) {
        $potentialCurrentJSON = $_GET['houseID'] . '.json';

        // and file currently exists
        if (file_exists($potentialCurrentJSON)) {
            $fileMakeTime = filemtime($potentialCurrentJSON);

            // modify callback for the case someone else is already parsing right now; potentially even still downloading (US takes longer to load)
            if ($fileMakeTime >= time() - 60) {
                $response['callback'] = 'waitForParseTimeout';
            } elseif ($fileMakeTime <= time() - 120) {
                // else unlink old file
                unlink($potentialCurrentJSON);
            }
        }
    }
}

echo json_encode($response);
