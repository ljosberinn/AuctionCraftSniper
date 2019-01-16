<!doctype html>

<html>
<head>
    <link rel="stylesheet" href="../assets/css/acs.min.css">
    <script async src="//wow.zamimg.com/widgets/power.js"></script>
    <script>
      const whTooltips = {
        'colorlinks': true,
        'iconizelinks': true,
      };
    </script>
</head>
<body>

<table>
    <?php

    $db = require '../dependencies/db.php';

    $pdo = new PDO('mysql:host=' . $db['host'] . ';dbname=' . $db['db'] . ';charset=utf8', $db['user'], $db['pw'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    $stmt = 'SELECT * FROM `recipes` WHERE `rarity` = 0 ORDER BY `id` ASC';

    $stmt = $pdo->query($stmt);

    foreach($stmt->fetchAll() as $recipe) {
        ?>
        <tr>
            <td class="has-text-centered">
                <a href="https://wowhead.com/?item=<?= $recipe['id'] ?>"><?= $recipe['id'] ?></a>
            </td>
        </tr>
        <?php
    } ?>

</table>

<script>
  const buildQuery = (start, rarity, elements) => {
    start += ' ' + rarity + ' WHERE';
    elements.forEach(element => start += '`id` = ' + element.innerText + ' OR ');
    return start.slice(0, -4);
  };

  setTimeout(() => {
    const queryStart = 'UPDATE `recipes` SET `rarity` =';

    const textareas = [];

    for (let i = 1; i <= 4; ++i) {
      const textarea = document.createElement('textarea');
      textarea.rows = 5;
      textarea.innerText = buildQuery(queryStart, i, document.querySelectorAll('.q' + i));
      textareas.push(textarea);
    }

    const body = document.getElementsByTagName('body')[0];
    body.innerHTML = '';

    textareas.forEach(textarea => body.appendChild(textarea));

  }, 5000);
</script>

</body>
</html>
