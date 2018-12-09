<?php

require_once 'dependencies/headers.php';
require_once 'dependencies/class.AuctionCraftSniper.php';

$AuctionCraftSniper = new AuctionCraftSniper();
$professions        = $AuctionCraftSniper->getProfessions();

?>

<!DOCTYPE html>
<html lang="en" prefix="og: http://ogp.me/ns#" itemscope itemtype="http://schema.org/WebPage">
<head>
    <?php require_once 'app/head.php' ?>
</head>
<body>

<section class="hero">
	<div class="hero-body">
		<div class="container">
			<h1 class="title is-size-1 is-size-3-mobile"> ` AuctionCraftSniper</h1>
			<h2 class="subtitle is-size-6-mobile"><?= $pageDescriptionEnding ?></h2>
		</div>
	</div>
</section>
<div class="container">
    <?php

    require_once 'app/description.html';

    require_once 'app/inc.menu.php';

    require_once 'app/inc.settings.php';

    require_once 'app/inc.subNav.php';

    require_once 'app/inc.tables.php';

    ?>
</div>

<footer class="footer is-dark">
    <?php require_once 'app/footer.html'; ?>
</footer>
</body>
</html>
