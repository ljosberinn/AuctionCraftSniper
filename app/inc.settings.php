<div id="settings-modal" class="box">

	<h1 class="title is-size-3-mobile has-text-warning">? Settings</h1>
	<h2 class="subtitle is-size-6-mobile has-text-info">Every change made will be saved instantly but may require a page reload or another search to be visible.</h2>

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
            case 'number':
                ?>
				<div class="field">
					<input type="number" class="<?= $infoArray['classes'] ?>" id="<?= $id ?>" placeholder="default 0">
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
        }
    } ?>
</div>
