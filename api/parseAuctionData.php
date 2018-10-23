<?php

ini_set('max_execution_time', 60);

require_once '../dependencies/headers.php';
require_once '../dependencies/class.AuctionCraftSniper.php';

$AuctionCraftSniper = new AuctionCraftSniper(false, [1, 2, 3, 4, 5, 6, 7, 8, 9]);

$itemIDs = $AuctionCraftSniper->getItemIDs();

$auctionValues = [];

$fileSize  = filesize('blackmoore.json');
$byteLimit = 512;

if ($stream = fopen('blackmoore.json', 'r')) {

    for ($bytes = 0; $bytes <= $fileSize; $bytes += $byteLimit) {
        $data = stream_get_contents($stream, $byteLimit, $bytes);

        foreach ($itemIDs as $itemID) {
            // check if :$itemID,"owner" exists
            if (substr_count($data, ':' . $itemID . ',"owner"') > 0) {
                // find position of $itemID
                $position = strpos($data, $itemID);

                if ($position >= 432) {
                    $data .= stream_get_contents($stream, $byteLimit + 128, $bytes);
                }

                // shorten data
                $tempData = substr($data, $position);

                // find next buyout value
                $buyoutPosition = strpos($tempData, '"buyout":');

                // shorten data
                $tempData = substr($tempData, $buyoutPosition + 9);

                // find next quantity
                $quantityPosition = strpos($tempData, ',"quantity":');
                $buyout           = substr($tempData, 0, $quantityPosition);

                // shorten data
                $tempData = substr($tempData, $quantityPosition + 12);

                // find next timeLeft
                $timeLeftPosition = strpos($tempData, ',"timeLeft":');
                $quantity         = substr($tempData, 0, $timeLeftPosition);


                $thisPrice     = round((int)$buyout / (int)$quantity);
                $previousPrice = (int)$auctionValues[$itemID];

                if ($thisPrice < $previousPrice || $previousPrice === 0) {
                    if((int)$itemID === 163224 && (int)$thisPrice === 3) {
                        echo '<script>console.log(' . json_encode([$buyout, $quantity]) . ');</script>';
                    }
                    $auctionValues[$itemID] = $thisPrice;
                }

                echo '<pre>thisPrice = ' . $thisPrice . ' // itemID = ' . $itemID . ' @ ' . $position . ' // buyout @ ' . $buyoutPosition . ' // quantity @ ' . $quantityPosition . ' // buyout = ' . $buyout . ' // quantity = ' . $quantity . '</pre>' . $data . ' <hr >';

                unset($position, $buyoutPosition, $quantityPosition, $buyout, $timeLeftPosition, $quantity, $thisPrice, $previousPrice, $tempData);
            }
        }
    }
    fclose($stream);

    echo '<script>console.log(' . json_encode($auctionValues) . ');</script>';
}
