<div id="settings-modal">

    <?php foreach ($AuctionCraftSniper->getAvailableSettings() as $id => $infoArray) {

        switch ($infoArray['type']) {
            case 'checkbox':
                ?>
				<div class="field">
					<input type="checkbox" class="<?= $infoArray['classes'] ?>" id="<?= $id ?>">
					<label for="<?= $id ?>"><?= $infoArray['description'] ?></label>
				</div>
                <?php
                break;
            case 'button':
                ?>
				<div class="field">
					<a class="button <?= $infoArray['classes'] ?>" id="<?= $id ?>">
						<span class="icon icon-small"></span>
						<span><?= $infoArray['description'] ?></span>
					</a>
				</div>
                <?php
                break;
            case 'number':
                ?>
				<div class="field">
					<input type="number" class="<?= $infoArray['classes'] ?>" id="<?= $id ?>">
					<label for="<?= $id ?>"><?= $infoArray['description'] ?></label>
				</div>
                <?php
                break;
        }
    } ?>
</div>
