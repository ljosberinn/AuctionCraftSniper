<?php

ini_set('max_execution_time', 60);

require_once '../dependencies/headers.php';
require_once '../dependencies/class.AuctionCraftSniper.php';

$AuctionCraftSniper = new AuctionCraftSniper(false, [1, 2, 3, 4, 5, 6, 7, 8, 9]);

$itemIDs = $AuctionCraftSniper->getItemIDs();

$auctionValues = [];

$fileSize = filesize('blackmoore.json');

$byteLimit = 512;

function strpos_all($haystack, $needle) {
    $offset = 0;
    $allpos = [];

    while (($pos = strpos($haystack, $needle, $offset)) !== false) {
        $offset   = $pos + 1;
        $allpos[] = $pos;
    }

    return $allpos;
}

function jsLog(...$vars) {
    echo '<script>console.log(' . json_encode($vars) . ');</script>';
}

function assignToGlobals(int $occurence, string $key) {
    global $itemArray;
    global $previousIndex;

    $itemArray[$key]['value'] = $occurence;
    $previousIndex            = $key;
}


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

                    $itemArray = [
                        'ownerPosition'      => ['position' => 0, 'value' => 0, 'searchString' => $itemID . ',"owner":',],
                        'ownerRealmPosition' => ['position' => 0, 'value' => 0, 'searchString' => ',"ownerRealm":',],
                        'bidPosition'        => ['position' => 0, 'value' => 0, 'searchString' => ',"bid":',],
                        'buyoutPosition'     => ['position' => 0, 'value' => 0, 'searchString' => ',"buyout":',],
                        'quantityPosition'   => ['position' => 0, 'value' => 0, 'searchString' => ',"quantity":',],
                        'timeLeftPosition'   => ['position' => 0, 'value' => 0, 'searchString' => ',"timeLeft":',],
                    ];

                    $previousIndex   = '';
                    $allowedOverflow = 32;

                    foreach ($itemArray as $key => $info) {
                        $occurences = strpos_all($data, $info['searchString']);

                        foreach ($occurences as $occurence) {
                            if ($occurence > $itemArray[$previousIndex]['position']) {
                                $itemArray[$key]['position'] = $occurence;
                                $previousIndex               = $key;
                                break;
                            }
                        }

                        // no valid occurence could be found, append more data
                        if ($itemArray[$key]['position'] === 0) {
                            $data            .= stream_get_contents($stream, $allowedOverflow, $bytes + $byteLimit);
                            $allowedOverflow += $allowedOverflow;
                            $occurences      = strpos_all($data, $info['searchString']);

                            foreach ($occurences as $occurence) {
                                if ($occurence > $itemArray[$previousIndex]['position']) {
                                    $itemArray[$key]['position'] = $occurence;
                                    $previousIndex               = $key;
                                    break;
                                }
                            }
                        }
                    }

                    if ($itemArray['ownerPosition']['position'] < $itemArray['ownerRealmPosition']['position'] && $itemArray['ownerRealmPosition']['position'] < $itemArray['bidPosition']['position'] && $itemArray['bidPosition']['position'] < $itemArray['buyoutPosition']['position'] && $itemArray['buyoutPosition']['position'] < $itemArray['quantityPosition']['position'] && $itemArray['quantityPosition']['position'] < $itemArray['timeLeftPosition']['position']) {

                    } else {
                        jsLog($itemArray, $data);
                        die;
                    }

                    ?>
					<tr>
						<td><?= $itemID ?></td>
                        <?php foreach ($itemArray as $key => $info) { ?>
							<td><?= $info['position'] ?> => <?= $info['value'] ?></td>
                        <?php } ?>
					</tr>
                    <?php

                    $auctionValues[] = $itemArray;
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
