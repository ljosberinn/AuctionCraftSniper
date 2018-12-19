<?php

header('Location: https://gerritalex.de', 301);
ob_start(function ($buffer) {

    $search = [
        '/\>[^\S ]+/s',     // strip whitespaces after tags, except space
        '/[^\S ]+\</s',     // strip whitespaces before tags, except space
        '/(\s)+/s',         // shorten multiple whitespace sequences
        '/<!--(.|\s)*?-->/' // Remove HTML comments
    ];

    $replace = [
        '>',
        '<',
        '\\1',
        '',
    ];

    return preg_replace($search, $replace, $buffer);
});

require_once 'dependencies/class.AuctionCraftSniper.php';

$AuctionCraftSniper = new AuctionCraftSniper();
$professions        = $AuctionCraftSniper->getProfessions();

?>

<!DOCTYPE html>
<html lang="en" prefix="og: http://ogp.me/ns#" itemscope itemtype="https://schema.org/WebPage">
<head>
    <?php require_once 'app/inc.head.php' ?>
</head>
<body>

<section class="hero">
	<div class="hero-body">
		<div class="container">
			<h1 class="title is-size-1 is-size-3-mobile has-text-warning"> ` AuctionCraftSniper</h1>
			<h2 class="subtitle is-size-6-mobile"><?= $pageDescriptionEnding ?></h2>
		</div>
	</div>
</section>
<div class="container">
    <?php

    require_once 'app/inc.menu.php';

    require_once 'app/inc.settings.php';

    require_once 'app/inc.description.html';

    require_once 'app/inc.houseUnavailability.html';

    ?>

	<div id="auction-craft-sniper">
        <?php

        require_once 'app/inc.subNav.php';

        require_once 'app/inc.tables.php';

        ?>
	</div>
</div>

<footer class="footer is-dark">
    <?php require_once 'app/inc.footer.html'; ?>
</footer>
</body>
</html>
