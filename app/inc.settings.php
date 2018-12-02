<div class="column" id="settings-modal">
    <?php foreach ($AuctionCraftSniper->getAvailableSettings() as $id => $description) { ?>
        <div class="field">
            <input type="checkbox" class="is-checkradio" id="<?= $id ?>">
            <label for="<?= $id ?>"><?= $description ?></label>
        </div>
    <?php } ?>
</div>
