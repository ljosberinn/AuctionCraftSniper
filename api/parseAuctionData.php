<?php

ini_set('max_execution_time', 60);

require_once '../dependencies/headers.php';
require_once '../dependencies/class.AuctionCraftSniper.php';

$AuctionCraftSniper = new AuctionCraftSniper(false, [1, 2, 3, 4, 5, 6, 7, 8, 9]);

$itemIDs = $AuctionCraftSniper->getItemIDs();

$auctionValues = [];

$fileSize  = filesize('blackmoore.json');
$byteLimit = 512;

$allowedOverflow = 64;
if ($stream = fopen('blackmoore.json', 'r')) {

    ?>
	<table style="width: 100%;">
		<thead>
		<tr>
			<th>itemID</th>
			<th>ownerPosition</th>
			<th>ownerRealmPosition</th>
			<th>bidPosition</th>
			<th>buyoutPosition</th>
			<th>quantityPosition</th>
			<th>timeLeftPosition</th>
		</tr>
		</thead>
		<tbody>
        <?php

        for ($bytes = 0; $bytes <= $fileSize; $bytes += $byteLimit) {
            $data = stream_get_contents($stream, $byteLimit, $bytes);

            foreach ($itemIDs as $itemID) {
                // check if :$itemID,"owner" exists
                if (substr_count($data, ':' . $itemID . ',') > 0) {

                    $ownerPosition = strpos($data, $itemID . ',"owner":');

                    if (!$ownerPosition) {
                        $data          .= stream_get_contents($stream, $allowedOverflow, $bytes + $byteLimit);
                        $ownerPosition = strpos($data, '"item":' . $itemID . ',"owner":');
                    }

                    $ownerRealmPosition = strpos($data, ',"ownerRealm":');

                    if (!$ownerRealmPosition) {
                        $data               .= stream_get_contents($stream, $allowedOverflow, $bytes + $byteLimit);
                        $ownerRealmPosition = strpos($data, ',"ownerRealm":');
                    }

                    $bidPosition = strpos($data, ',"bid":');

                    if (!$bidPosition) {
                        $data        .= stream_get_contents($stream, $allowedOverflow, $bytes + $byteLimit);
                        $bidPosition = strpos($data, ',"bid":');
                    }

                    $buyoutPosition = strpos($data, ',"buyout":');

                    if (!$buyoutPosition) {
                        $data           .= stream_get_contents($stream, $allowedOverflow, $bytes + $byteLimit);
                        $buyoutPosition = strpos($data, ',"buyout":');
                    }

                    $quantityPosition = strpos($data, ',"quantity":');

                    if (!$quantityPosition) {
                        $data             .= stream_get_contents($stream, $allowedOverflow, $bytes + $byteLimit);
                        $quantityPosition = strpos($data, ',"quantity":');
                    }

                    $timeLeftPosition = strpos($data, ',"timeLeft":');

                    if (!$timeLeftPosition) {
                        $data             .= stream_get_contents($stream, $allowedOverflow, $bytes + $byteLimit);
                        $timeLeftPosition = strpos($data, ',"timeLeft":');
                    }


                    /*if (!$ownerPosition || !$ownerRealmPosition || !$bidPosition || !$buyoutPosition || !$quantityPosition || !$timeLeftPosition) {
                        echo $itemID . ' => ' . $data;
                        die;
                    }*/


                    ?>
					<tr>
						<td><?= $itemID ?></td>
						<td><?= $ownerPosition ?></td>
						<td><?= $ownerRealmPosition ?></td>
						<td><?= $bidPosition ?></td>
						<td><?= $buyoutPosition ?></td>
						<td><?= $quantityPosition ?></td>
						<td><?= $timeLeftPosition ?></td>
					</tr>
                    <?php

                    unset($ownerPosition, $ownerRealmPosition, $bidPosition, $buyoutPosition, $quantityPosition, $timeLeftPosition);


                    /*// find position of $itemID
                    $itemIDPosition = strpos($data, $itemID);

                    if ($itemIDPosition >= 432) {
                        $data .= stream_get_contents($stream, 32, $bytes + $byteLimit);
                    }

                    // shorten data
                    $tempData = substr($data, $itemIDPosition + strlen((string)$itemID));

                    // find next buyout value
                    $buyoutPosition = strpos($tempData, '"buyout":');

                    if (!$buyoutPosition) {
                        $tempData       .= stream_get_contents($stream, 96, $bytes + $byteLimit);
                        $buyoutPosition = strpos($tempData, '"buyout":');
                    }

                    // shorten data
                    $tempData = substr($tempData, $buyoutPosition + 9);

                    // find next quantity
                    $quantityPosition = strpos($tempData, ',"quantity":');

                    if (!$quantityPosition) {
                        $tempData         .= stream_get_contents($stream, 96, $bytes + $byteLimit);
                        $quantityPosition = strpos($tempData, ',"quantity":');
                    }

                    $buyout = substr($tempData, 0, $quantityPosition);

                    // shorten data
                    $tempData = substr($tempData, $quantityPosition + 12);

                    // find next timeLeft
                    $timeLeftPosition = strpos($tempData, ',"');

                    if (!$timeLeftPosition) {
                        $tempData         .= stream_get_contents($stream, 96, $bytes + $byteLimit);
                        $timeLeftPosition = strpos($tempData, ',"');
                    }

                    $quantity = substr($tempData, 0, $timeLeftPosition);


                    $thisPrice     = round((int)$buyout / (int)$quantity);
                    $previousPrice = (int)$auctionValues[$itemID];

                    if ($thisPrice < $previousPrice || $previousPrice === 0) {
                        $auctionValues[$itemID] = $thisPrice;
                    }

                    if ((int)$buyout === 0 || (int)$quantity === 0 || (int)$thisPrice === 0) { ?>
						<tr>
							<td><?= $itemID ?></td>
							<td><?= $buyout ?></td>
							<td><?= $quantity ?></td>
							<td><?= $thisPrice ?></td>
							<td>
								<pre><?= $tempData ?></pre>
							</td>
						</tr>
                    <?php }

                    #echo '<pre>thisPrice = ' . $thisPrice . ' // itemID = ' . $itemID . ' @ ' . $position . ' // buyout @ ' . $buyoutPosition . ' // quantity @ ' . $quantityPosition . ' // buyout = ' . $buyout . ' // quantity = ' . $quantity . '</pre>' . $data . ' <hr >';

                    unset($position, $buyoutPosition, $quantityPosition, $buyout, $timeLeftPosition, $quantity, $thisPrice, $previousPrice, $tempData);*/
                }
            }
        }
        ?>
		</tbody>
	</table>
    <?php
    fclose($stream);

    echo '<script>console.log(' . json_encode($auctionValues) . ');</script>';
}
