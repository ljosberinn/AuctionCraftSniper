<progress id="progress-bar" class="progress is-primary is-medium" max="100"></progress>

<div class="box has-background-dark">
	<p class="has-text-info">Most recent changes</p>
	<ul>
		<li>Expulsom worth can now automatically be calculated based on your realms economy. Check out the settings!</li>
	</ul>
</div>

<div class="tabs is-boxed is-small">
	<ul>
        <?php foreach ($professions as $id => $name) {
            $lowercased = lcfirst($name);
            ?>
			<li data-profession-tab="<?= $lowercased ?>">
				<a href="#auction-craft-sniper">
					<i class="professions-sprite <?= $lowercased ?> icon-disabled"></i>
					<span><?= $name ?></span>
				</a>
			</li>
        <?php } ?>
		<li data-tippy="export all whitelisted recipes to TSM" id="general-tsm-export">
			<a>
				<i class="tsm"></i>
			</a>
		</li>
	</ul>
</div>
