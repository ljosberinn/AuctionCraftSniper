<?php

require_once '../dependencies/headers.php';

$db         = require_once 'db.php';
$connection = new mysqli($db['host'], $db['user'], $db['pw'], $db['db']);
$connection->set_charset('utf8');

$houseID = (int)$_GET['house'];

if ($houseID !== 0) {

    $getLastUpdateTimestampQuery = "SELECT `timestamp` FROM `auctionData` WHERE `houseID` = " . $houseID . " LIMIT 1";

    $lastUpdateTimestamp = 0;
    $houseRequiresUpdate = false;

    $data = $connection->query($getLastUpdateTimestampQuery);

    // house has been previously fetched, check whether it needs an update
    if ($data->num_rows > 0) {

        while ($stream = $data->fetch_assoc()) {
            $lastUpdateTimestamp = (int)$stream['timestamp'];
        }

        // AH data supposedly updates once every 20 minutes
        if ($lastUpdateTimestamp < time() - 20 * 60) {
            $houseRequiresUpdate = true;
        }

    } else {
        // house has never been fetched before
        $houseRequiresUpdate = true;
    }

    echo json_encode(['callback' => $houseRequiresUpdate ? 'houseRequiresUpdate' : 'getProfessionTables']);
}
