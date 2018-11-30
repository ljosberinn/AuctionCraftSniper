<?php

function logJSON(...$vars) {
    ?>
	<script>console.log(<?=json_encode($vars)?>);</script>
    <?php
}

require_once 'dependencies/headers.php';
require_once 'dependencies/class.AuctionCraftSniper.php';

$AuctionCraftSniper = new AuctionCraftSniper();
$professions        = $AuctionCraftSniper->getProfessions();

?>

<!DOCTYPE html>
<html lang="en" prefix="og: http://ogp.me/ns#" itemscope itemtype="http://schema.org/WebPage">
<head>
    <?php require_once 'app/head.php' ?>
</head>
<body>

<header class="has-text-centered">
	<h1 class="is-size-1">` AuctionCraftSniper</h1>
</header>
<main>

	<section class="columns">
		<div class="field column is-4">
			<label class="label">select professions</label>
			<div class="control">
                <?php foreach ($professions as $id => $name) { ?>
					<label class="checkbox">
						<i class="professions-sprite icon-<?= $id ?> icon-disabled" data-tippy="<?= $name ?>"></i>
						<input type="checkbox" value="<?= $id ?>">
					</label>
                <?php } ?>
			</div>
		</div>

		<div class="field column is-2">
			<label class="label">select region & realm...</label>
			<div class="control has-icons-right">
				<input class="input" id="realm" type="text" list="realms" placeholder="e.g. EU-Blackmoore">
				<datalist id="realms">
                    <?php foreach ($AuctionCraftSniper->getRealms() as $houseID => $realm) { ?>
						<option data-house-id="<?= $houseID ?>" value="<?= $realm ?>"></option>
                    <?php } ?>
				</datalist>
				<!--<p class="help is-success">This username is available</p>-->
			</div>
		</div>

		<div class="field column is-2">
			<label class="label" for="expansion-level">change expansion</label>
			<div class="control">
				<div class="select">
					<select id="expansion-level">
						<option disabled>search expansion-specific recipes...</option>
                        <?php foreach ($AuctionCraftSniper->getExpansionLevels() as $expansionLevel => $expansionName) { ?>
							<option value="<?= $expansionLevel ?>"<?= $expansionLevel === 8 ? 'selected' : '' ?>><?= $expansionName ?></option>
                        <?php } ?>
					</select>
				</div>
			</div>
		</div>

		<div class="column is-2">
			<button class="is-primary button" id="search">Go</button>
			<label class="label">Last update:<br/><span id="last-update"></span></label>
		</div>
	</section>

	<section>

		<div class="field" style="width: 100%; height: 50px;">
			<label id="progress-state"></label>
			<progress id="progress-bar" class="progress is-primary is-small" max="100"></progress>
		</div>

		<div class="tabs is-small">
			<ul>
                <?php foreach ($professions as $id => $name) { ?>
					<li>
						<a>
							<span class="icon">
								<i class="professions-sprite icon-<?= $id ?> icon-disabled" data-tippy="<?= $name ?>"></i>
							</span>
							<span><?= $name ?></span>
						</a>
					</li>
                <?php } ?>
			</ul>
		</div>

		<div id="auction-craft-sniper">
            <?php foreach ($professions as $id => $name) { ?>
				<table id="<?= lcfirst($name) ?>" class="table is-narrow is-bordered is-striped"></table>
            <?php } ?>
		</div>
	</section>

</main>

<footer>
    <?php require_once 'app/footer.html'; ?>
</footer>
<style data-dev>
	table tr td:not(:first-of-type), table tr th:not(:first-of-type) {
		text-align: right;
	}
</style>
</body>
</html>
