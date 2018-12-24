<div id="settings-modal" class="box">

	<h1 class="title is-size-3-mobile has-text-warning">? Settings</h1>
	<h2 class="subtitle is-size-6-mobile has-text-info">Every change made will be saved instantly but may require a page reload or another search to be visible.</h2>

    <?php

    const SETTINGS = [
        'checkbox' => [
            'fetchOnLoad'               => [
                'description' => 'automatically fetch data on page load (last selected realm will be used)',
            ],
            'pushNotificationsAllowed'  => [
                'description' => 'send push notifications when new auction house data is available',
            ],
            'alwaysShowLossyRecipes'    => [
                'description' => 'always show lossy recipes',
            ],
            'alwaysShowUnlistedRecipes' => [
                'description' => 'always show unlisted recipes',
            ],
            'hideBlacklistedRecipes'    => [
                'description' => 'hide blacklisted recipes entirely (requires unchecking of this setting to show blacklisted recipes again)',
            ],
            'useAssumedAlchemyProcRate' => [
                'description' => 'adjust profits of potions|flasks using a assumed proc rate of 1.4',
            ],
        ],
        'number'   => [
            'marginThresholdPercent' => [
                'description' => 'define a custom <strong>% margin threshold</strong> of recipes to show',
                'placeholder' => '13.4 equals 13.4%',
            ],
            'profitThresholdValue'   => [
                'description' => '<strong>overrides threshold %!</strong><br>define a custom <strong>absolute value in <span class="currency gold"></span></strong> threshold of recipes to show',
                'placeholder' => '13.4 equals 13 gold 40 silver',
            ],
        ],
        'button'   => [
            'showLocalStorage'  => [
                'description' => 'show locally stored data',
                'type'        => 'button',
                'classes'     => 'is-info',
                'icon'        => 'info',
            ],
            'clearLocalStorage' => [
                'description' => 'clear locally stored data',
                'type'        => 'button',
                'classes'     => 'is-danger',
                'icon'        => 'nuke',
            ],
        ],
    ];

    foreach (SETTINGS['checkbox'] as $setting => $infoArray) {
        ?>
		<div class="field">
			<input type="checkbox" class="is-checkradio" id="<?= $setting ?>">
			<label for="<?= $setting ?>"><?= $infoArray['description'] ?></label>
		</div>
    <?php } ?>

	<hr class="has-background-dark">

    <?php foreach (SETTINGS['number'] as $setting => $infoArray) { ?>
		<div class="control">
			<input class="input" type="number" min="0" placeholder="default 0, <?= $infoArray['placeholder'] ?>" id="<?= $setting ?>">
			<label for="<?= $setting ?>"><?= $infoArray['description'] ?></label>
		</div>
    <?php } ?>

	<hr class="has-background-dark">

	<div class="field">
        <?php foreach (SETTINGS['button'] as $setting => $infoArray) { ?>
			<a class="button <?= $infoArray['classes'] ?>" id="<?= $setting ?>">
				<span class="icon icon-small"></span>
				<span><?= $infoArray['description'] ?></span>
			</a>
        <?php } ?>
	</div>
</div>
