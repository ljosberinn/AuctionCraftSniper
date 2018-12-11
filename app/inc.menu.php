<div class="columns" style="margin-top: 1.5rem;">

	<div class="field column control">
		<input class="input" id="realm" type="text" list="realms" placeholder="e.g. EU-Blackmoore">
		<datalist id="realms">
            <?php foreach ($AuctionCraftSniper->getRealms() as $houseID => $realms) {
                foreach ($realms as $realm) { ?>
					<option data-house-id="<?= $houseID ?>" value="<?= $realm ?>"></option>
                <?php }
            } ?>
		</datalist>
		<p id="hint-invalid-region-realm" class="help has-text-danger">Invalid region-realm pair.</p>
		<p id="last-update-wrap" class="help has-text-info">Last update <span id="last-update"></span></p>
		<p id="next-update-wrap" class="help has-text-warning">Next update in <span id="next-update"></span></p>
	</div>

	<div class="field column" id="professions">
		<div class="control has-text-centered">
            <?php foreach ($professions as $id => $name) { ?>
				<label class="checkbox">
					<i class="professions-sprite <?= lcfirst($name) ?> icon-disabled" data-tippy="<?= $name ?>"></i>
					<input type="checkbox" value="<?= $id ?>">
				</label>
            <?php } ?>
			<p id="hint-invalid-professions" class="help has-text-danger">Missing profession selection.</p>
		</div>
	</div>

	<div class="field column is-2 is-12-mobile">
		<div class="control select">
			<select id="expansion-level">
				<option disabled>search expansion-specific recipes...</option>
                <?php foreach ($AuctionCraftSniper->getExpansionLevels() as $expansionLevel => $expansionName) { ?>
					<option value="<?= $expansionLevel ?>" <?= $expansionLevel === 8 ? 'selected' : 'disabled' ?>><?= $expansionName ?></option>
                <?php } ?>
			</select>
		</div>
	</div>

	<div class="column is-3 has-text-right-desktop">
        <?php

        foreach ([
                     'Settings' => 'is-info',
                     'Search'   => 'is-primary',
                 ] as $title => $colorClass) { ?>
			<a class="button <?= $colorClass ?>" id="<?= lcfirst($title) ?>">
				<span class="icon is-small"></span>
				<span><?= $title ?></span>
			</a>
        <?php } ?>
	</div>
</div>
