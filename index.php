<?php

function logJSON(...$vars) {
    ?>
	<script>console.log(<?=json_encode($vars)?>);</script>
    <?php
}

require_once 'dependencies/headers.php';
require_once 'dependencies/class.AuctionCraftSniper.php';

$AuctionCraftSniper = new AuctionCraftSniper();

?>

<!DOCTYPE html>
<head>
	<link href="assets/css/normalize.css" rel="stylesheet"/>
	<link href="assets/css/custom.css" rel="stylesheet"/>
	<title>AuctionCraftSniper - WIP</title>
	<script defer src="assets/js/bundle.min.js"></script>
</head>
<body>

<header>
	<h1>` AuctionCraftSniper</h1>
</header>
<main>

	<div>
        <?php foreach ($AuctionCraftSniper->getProfessions() as $id => $name) { ?>
			<label><i class="sprite icon-<?= $id ?>" data-tippy="<?= $name ?>"></i>
				<input type="checkbox" value="<?= $id ?>">
			</label>
        <?php } ?>
	</div>

	<div>
		<input id="realm" type="text" list="realms">
		<datalist id="realms">
            <?php foreach ($AuctionCraftSniper->getRealms() as $realm) { ?>
				<option value="<?= $realm ?>"></option>
            <?php } ?>
		</datalist>
	</div>

	<hr>
	<div style="width: 100%; height: 50px;">
		<div id="progress" style="height: 100%; background-color: purple;"></div>
	</div>

	<textarea id="result"></textarea>

</main>

<footer>

</footer>

</body>
