<?php

$indexMakeTime = filemtime('index.php');
$jsMakeTime    = filemtime('assets/js/bundle.min.js');

$pageDescriptionEnding = 'on-demand near-real time information about profession-related auction house prices for World of Warcraft';

?>

<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width">

<meta name="theme-color" content="#342f2d"/>
<!-- All Search Engines -->
<!--<meta name="robots" content="index,nofollow"/>-->
<!-- Google Specific -->
<!--<meta name="googlebot" content="index,nofollow"/>-->
<!-- admin contact information -->
<link rel="me" href="mailto:admin@gerritalex.de"/>
<meta name="author" content="Gerrit Alex"/>
<meta name="language" content="en"/>

<meta name="reply-to" content="admin@gerritalex.de"/>
<meta name="distribution" content="global"/>
<!--<meta name="revisit-after" content="7 days"/>-->

<!-- OpenGraph for Facebook & WhatsApp -->
<!--<meta property="og:title" content="AuctionCraftSniper"/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="https://auctioncraftsniper.com/">
<meta property="og:description" content="AuctionCraftSniper provides <?= $pageDescriptionEnding ?>"/>-->

<!-- Google+ page description -->
<meta itemprop="name" content="AuctionCraftSniper"/>
<meta itemprop="description" content="AuctionCraftSniper provides <?= $pageDescriptionEnding ?>"/>
<meta itemprop="lastReviewed" content="<?= date('Y-m-d', $indexMakeTime ?: $jsMakeTime) ?>"/>
<link rel="canonical" href="https://auctioncraftsniper.com">
<link href="//fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet">
<link href="/assets/css/acs.min.css?<?= filemtime('assets/css/acs.min.css') ?>" rel="stylesheet">

<title>AuctionCraftSniper - WIP</title>

<script defer src="/assets/js/bundle.min.js?<?= $jsMakeTime ?>"></script>
<script>
  const whTooltips = {
    "colorlinks": true,
    "iconizelinks": true,
    'renamelinks': true
  }
</script>
<script async src="//wow.zamimg.com/widgets/power.js"></script>
<?php foreach (['gold', 'silver', 'copper'] as $currency) { ?>
<link rel="preload" as="image" href="//wow.zamimg.com/images/icons/money-<?= $currency ?>.gif" type="image/gif">
<?php } ?>