<?php

$indexMakeTime = filemtime('index.php');
$jsMakeTime    = filemtime('assets/js/bundle.min.js');

$pageDescriptionEnding = 'on-demand near-real time information about profession-related auction house prices for World of Warcraft';

?>

<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width">
<meta name="theme-color" content="#2b3e50">

<!-- All Search Engines -->
<meta name="robots" content="index,nofollow"/>
<!-- Google Specific -->
<meta name="googlebot" content="index,nofollow"/>
<!-- admin contact information -->
<link rel="me" href="mailto:admin@gerritalex.de"/>
<meta name="author" content="Gerrit Alex"/>
<meta name="language" content="en"/>
<meta name="description" content="AuctionCraftSniper provides <?= $pageDescriptionEnding ?>" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#2b3e50">
<meta name="msapplication-TileColor" content="#2b3e50">

<meta name="reply-to" content="admin@gerritalex.de"/>
<meta name="distribution" content="global"/>
<meta name="revisit-after" content="7 days"/>

<!-- OpenGraph for Facebook & WhatsApp -->
<meta property="og:title" content="AuctionCraftSniper"/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="https://auctioncraftsniper.com/">
<meta property="og:image" content="https://auctioncraftsniper.com/assets/img/favicon.png"/>
<meta property="og:description" content="AuctionCraftSniper provides <?= $pageDescriptionEnding ?>"/>

<!-- Google+ page description -->
<meta itemprop="name" content="AuctionCraftSniper"/>
<meta itemprop="description" content="AuctionCraftSniper provides <?= $pageDescriptionEnding ?>"/>
<meta itemprop="lastReviewed" content="<?= date('Y-m-d', $indexMakeTime ?: $jsMakeTime) ?>"/>
<link rel="canonical" href="https://auctioncraftsniper.com">
<link href="//fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet">
<link href="/assets/css/acs.min.css?<?= filemtime('assets/css/acs.min.css') ?>" rel="stylesheet">
<link rel="icon" type="image/png" href="/assets/img/favicon.png">

<?php foreach (['gold', 'silver', 'copper'] as $currency) { ?>
	<link rel="preload" as="image" href="//wow.zamimg.com/images/icons/money-<?= $currency ?>.gif" type="image/gif">
<?php } ?>

<title>AuctionCraftSniper</title>

<script defer src="/assets/js/bundle.min.js?<?= $jsMakeTime ?>"></script>
<script>
  const whTooltips = {
    "colorlinks": true,
    "iconizelinks": true,
    'renamelinks': true
  }
</script>
<script async src="//wow.zamimg.com/widgets/power.js"></script>

