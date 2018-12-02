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

<header class="has-text-centered">
	<h1 class="is-size-1">` AuctionCraftSniper</h1>
</header>
<main>

    <?php

    require_once 'app/inc.menu.php';

    require_once 'app/inc.settings.php';

    ?>
	<section>

		<div class="column is-2">
			<button class="is-primary button" id="search">Go</button>
			<label class="label">Last update:<br/><span id="last-update"></span></label>
		</div>

        <?php

        require_once 'app/inc.subNav.php';

        require_once 'app/inc.tables.php';

        ?>
	</section>
</main>

<footer>
    <?php require_once 'app/footer.html'; ?>
</footer>
</body>
</html>
