<div class="field" style="width: 100%; height: 50px;">
	<label id="progress-state"></label>
	<progress id="progress-bar" class="progress is-primary is-small" max="100"></progress>
</div>

<div class="tabs is-small">
	<ul>
        <?php foreach ($professions as $id => $name) { ?>
			<li>
				<a>
					<i class="professions-sprite <?= lcfirst($name) ?> icon-disabled" data-tippy="<?= $name ?>"></i>
					<span><?= $name ?></span>
				</a>
			</li>
        <?php } ?>
	</ul>
</div>
