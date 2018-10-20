<?php

function logJSON(...$vars)
{
    ?>
  <script>console.log(<?=json_encode($vars)?>);</script>
    <?php
}

require_once 'dependencies/class.AuctionCraftSniper.php';

$AuctionCraftSniper = new AuctionCraftSniper();

?>

<!DOCTYPE html>
<head>
  <link href="assets/css/normalize.css" rel="stylesheet"/>
  <link href="assets/css/custom.css" rel="stylesheet"/>
  <title>AuctionCraftSniper - WIP</title>
</head>
<body>

<header>
<h1>` AuctionCraftSniper</h1>
</header>
<main>

  <div>
        <?php foreach ($AuctionCraftSniper->getProfessions() as $id => $name) {?>
      <label><i class="sprite icon-<?=$id?>" data-tippy="<?=$name?>"></i>
        <input type="checkbox" value="<?=$id?>">
      </label>
        <?php }?>
  </div>

  <div>
    <input id="realm" type="text" list="realms">
    <datalist id="realms">
      <?php foreach ($AuctionCraftSniper->getRealms() as $realm) {?>
        <option value="<?=$realm?>"></option>
      <?php }?>
    </datalist>
  </div>

</main>

<footer>

</footer>
<script src="assets/js/bundle.min.js"></script>
</body>
