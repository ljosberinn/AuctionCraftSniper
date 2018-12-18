<div id="settings-modal" class="box">

	<h1 class="title is-size-3-mobile has-text-warning">? Settings</h1>
	<h2 class="subtitle is-size-6-mobile has-text-info">Every change made will be saved instantly but may require a page reload or another search to be visible.</h2>

    <?php

    const SETTINGS = [
        'checkbox' => [
            'fetchOnLoad'               => [
                'description' => 'automatically fetch data on page load (last selected realm will be used)',
                'type'        => 'checkbox',
                'classes'     => 'is-checkradio',
            ],
            'pushNotificationsAllowed'  => [
                'description' => 'send push notifications when new auction house data is available',
                'type'        => 'checkbox',
                'classes'     => 'is-checkradio',
            ],
            'alwaysShowLossyRecipes'    => [
                'description' => 'always show lossy recipes',
                'type'        => 'checkbox',
                'classes'     => 'is-checkradio',
            ],
            'alwaysShowUnlistedRecipes' => [
                'description' => 'always show unlisted recipes',
                'type'        => 'checkbox',
                'classes'     => 'is-checkradio',
            ],
            'hideBlacklistedRecipes'    => [
                'description' => 'hide blacklisted recipes entirely (requires unchecking of this setting to show blacklisted recipes again)',
                'type'        => 'checkbox',
                'classes'     => 'is-checkradio',
            ],
        ],
        'input'    => [
            'marginThresholdPercent' => [
                'description' => '<span class="has-text-warning">COMING SOON</span> define a custom <strong>percentage</strong> threshold of recipes to show',
                'type'        => 'number',
                'classes'     => 'input',
            ],
            'marginThresholdValue'   => [
                'description' => '<span class="has-text-warning">COMING SOON</span> define a custom <strong>absolute value</strong> threshold of recipes to show',
                'type'        => 'number',
                'classes'     => 'input',
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
			<input type="checkbox" class="<?= $infoArray['classes'] ?>" id="<?= $setting ?>">
			<label for="<?= $setting ?>"><?= $infoArray['description'] ?></label>
		</div>
        <?php
    }

    echo '<hr class="has-background-dark">';

    foreach (SETTINGS['input'] as $setting => $infoArray) {
        ?>
		<div class="field">
			<input type="number" class="<?= $infoArray['classes'] ?>" id="<?= $setting ?>" placeholder="default 0">
			<label for="<?= $setting ?>"><?= $infoArray['description'] ?></label>
		</div>
        <?php
    }

    echo '<hr class="has-background-dark">';

    foreach (SETTINGS['button'] as $setting => $infoArray) {
        ?>
		<div class="field">
			<a class="button <?= $infoArray['classes'] ?>" id="<?= $setting ?>">
				<span class="icon icon-small"></span>
				<span><?= $infoArray['description'] ?></span>
			</a>
		</div>
        <?php
    }

    ?>
</div>
