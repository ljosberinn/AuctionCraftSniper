<?php

if (isset($_GET['houseID'], $_GET['professions'], $_GET['expansionLevel']) && is_numeric($_GET['houseID']) && is_numeric($_GET['expansionLevel'])) {

    require_once '../dependencies/headers.php';
    require_once '../dependencies/class.AuctionCraftSniper.php';

    $AuctionCraftSniper = new AuctionCraftSniper();

    $AuctionCraftSniper->setExpansionLevel($_GET['expansionLevel']);
    $AuctionCraftSniper->setHouseID($_GET['houseID']);

    $professions = $AuctionCraftSniper->AreValidProfessions(explode(',', $_GET['professions']));

    if ($professions) {
        echo json_encode($AuctionCraftSniper->getProfessionData($professions), JSON_NUMERIC_CHECK);
    }
}
