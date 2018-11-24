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
<html lang="en" prefix="og: http://ogp.me/ns#" itemscope itemtype="http://schema.org/WebPage">
<head>
    <?php require_once 'app/head.php' ?>
</head>
<body style="font-family: 'Open Sans', sans-serif; margin-top: -20px;">

<header>
	<h1>` AuctionCraftSniper

		<div style="display: inline-block;">
            <?php foreach ($AuctionCraftSniper->getProfessions() as $id => $name) { ?>
				<label><i class="professions-sprite icon-<?= $id ?> icon-disabled" data-tippy="<?= $name ?>"></i>
					<input type="checkbox" value="<?= $id ?>">
				</label>
            <?php } ?>
		</div>
	</h1>
</header>
<main>


	<div>
		<input id="realm" type="text" list="realms" placeholder="Search region & realm...">
		<datalist id="realms">
            <?php foreach ($AuctionCraftSniper->getRealms() as $realm) { ?>
				<option value="<?= $realm ?>"></option>
            <?php } ?>
		</datalist>
	</div>

	<div>
		<label for="expansion-level">change Expansion
			<select id="expansion-level">
				<option disabled>Search expansion-specific recipes...</option>
                <?php foreach ($AuctionCraftSniper->getExpansionLevels() as $expansionLevel => $expansionName) { ?>
					<option value="<?= $expansionLevel ?>"<?= $expansionLevel === 8 ? 'selected' : '' ?>><?= $expansionName ?></option>
                <?php } ?>
			</select>
		</label>
	</div>

	<div>
		<button id="search">Go</button>
	</div>

	<hr>
	<div style="width: 100%; height: 50px;">
		<div id="progress-state"></div>
		<div id="progress-bar" style="height: 100%; background-color: purple;">progress-bar</div>
	</div>

	<div id="auction-craft-sniper">

	</div>

</main>

<footer>
    <?php require_once 'app/footer.html'; ?>
</footer>
<style data-dev>
	table {
		width: 100%;
	}

	table tr td:not(:first-of-type), table tr th:not(:first-of-type) {
		text-align: right;
	}
</style>
</body>
</html>
