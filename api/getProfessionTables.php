<?php


if (isset($_GET['house']) && is_numeric ($_GET['house']) && isset($_GET['professions']) && isset($_GET['expansionLevel']) && is_numeric ($_GET['expansionLevel'])) {

    require_once '../dependencies/headers.php';
    require_once '../dependencies/class.AuctionCraftSniper.php';

    $AuctionCraftSniper = new AuctionCraftSniper();

    $house          = $AuctionCraftSniper->isValidHouse ((int) $_GET['house']);
    $professions    = $AuctionCraftSniper->AreValidProfessions (explode (',', $_GET['professions']));
    $expansionLevel = $AuctionCraftSniper->isValidExpansionLevel ((int) $_GET['expansionLevel']);

    echo json_encode ($AuctionCraftSniper->getProfessionData ($house, $professions, $expansionLevel));

}
