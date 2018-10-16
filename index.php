<?php

function paScript(...$vars)
{
    ?>
  <script>console.log(<?=json_encode($vars)?>);</script>
    <?php
}

$db = require_once 'api/db.php';
$connection = new mysqli($db['host'], $db['user'], $db['pw'], $db['db']);
$connection->set_charset('utf8');

$professionQuery = "SELECT * FROM `professions` ORDER BY `name` ASC";
$professions = [];

$data = $connection->query($professionQuery);

if ($data->num_rows > 0) {

    while ($stream = $data->fetch_assoc()) {
        $professions[$stream['id']] = $stream['name'];
    }
}

$regions = ['EU', 'US'];

$realms = [];

foreach ($regions as $region) {
    $realmQuery = "SELECT `house`, `name` FROM `realms` WHERE `region` = '" . $region . "' ORDER BY `name` ASC";
    $data = $connection->query($realmQuery);

    if ($data->num_rows > 0) {
        while ($stream = $data->fetch_assoc()) {
            $realms[$stream['house']] = $region . '-' . $stream['name'];
        }
    }
}

?>

<!DOCTYPE html>
<head>
  <link href="assets/css/normalize.css" rel="stylesheet"/>
</head>
<body>

<header>

</header>
<main>

  <div>
        <?php foreach ($professions as $id => $name) {?>
      <label><?=$name?>
        <input type="checkbox" value="<?=$id?>">
      </label>
        <?php }?>
  </div>

  <div>
    <input id="realm" type="text" list="realms">
    <datalist id="realms">
      <?php foreach ($realms as $id => $realm) {?>
        <option value="<?=$realm?>"></option>
      <?php }?>
    </datalist>
  </div>

</main>

<footer>

</footer>
<script src="assets/js/bundle.min.js"></script>
</body>
