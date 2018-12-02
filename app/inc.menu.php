<section class="columns">
	<div class="field column is-4" id="professions">
		<label class="label">select professions</label>
		<div class="control">
            <?php foreach ($professions as $id => $name) { ?>
				<label class="checkbox">
					<i class="professions-sprite <?= lcfirst($name) ?> icon-disabled" data-tippy="<?= $name ?>"></i>
					<input type="checkbox" value="<?= $id ?>">
				</label>
            <?php } ?>
		</div>
	</div>

	<div class="field column is-4">
		<label class="label">select region & realm...</label>
		<div class="control has-icons-right">
			<input class="input" id="realm" type="text" list="realms" placeholder="e.g. EU-Blackmoore">
			<datalist id="realms">
                <?php foreach ($AuctionCraftSniper->getRealms() as $houseID => $realm) { ?>
					<option data-house-id="<?= $houseID ?>" value="<?= $realm ?>"></option>
                <?php } ?>
			</datalist>
			<p id="hint-invalid-region-realm" class="help has-text-danger">Invalid region-realm pair.</p>
		</div>
	</div>

	<div class="field column is-4">
		<label class="label" for="expansion-level">change expansion</label>
		<div class="control">
			<div class="select">
				<select id="expansion-level">
					<option disabled>search expansion-specific recipes...</option>
                    <?php foreach ($AuctionCraftSniper->getExpansionLevels() as $expansionLevel => $expansionName) { ?>
						<option value="<?= $expansionLevel ?>" <?= $expansionLevel === 8 ? 'selected' : '' ?>><?= $expansionName ?></option>
                    <?php } ?>
				</select>
			</div>
		</div>
	</div>
</section>
