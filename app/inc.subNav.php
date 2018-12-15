<progress id="progress-bar" class="progress is-primary is-medium" max="100"></progress>

<div class="tabs is-boxed is-small">
	<ul>
        <?php foreach ($professions as $id => $name) {
        	$lowercased = lcfirst($name);
        	?>
			<li data-profession-tab="<?= $lowercased ?>">
				<a href="#<?= $lowercased ?>">
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
