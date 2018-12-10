<div class="field visible" id="progress-bar-wrap">
	<progress id="progress-bar" class="progress is-primary is-medium" max="100"></progress>
</div>

<div class="tabs is-boxed is-small">
	<ul>
        <?php foreach ($professions as $id => $name) { ?>
			<li data-profession-tab="<?= lcfirst($name) ?>">
				<a>
					<i class="professions-sprite <?= lcfirst($name) ?> icon-disabled"></i>
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
