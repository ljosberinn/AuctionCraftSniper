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
