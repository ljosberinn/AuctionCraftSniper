<?php

$success = 0;

if (isset($_GET['expansionLevel']) && is_numeric($_GET['expansionLevel']) && (int)$_GET['expansionLevel'] !== 0) {

    require_once '../dependencies/headers.php';
    require_once '../dependencies/class.AuctionCraftSniper.php';

    $AuctionCraftSniper = new AuctionCraftSniper();

    $AuctionCraftSniper->setExpansionLevel($_GET['expansionLevel']);

    $recipeRequirements = [];

    foreach ($AuctionCraftSniper->getRecipeIDs() as $recipeID) {
        foreach ($AuctionCraftSniper->getWoWDBJSON('/item/' . $recipeID)['CreatedBySpellIDs'] as $spellID) {
            $spellData = $AuctionCraftSniper->getWoWDBJSON('/spell/' . $spellID);

            $spellDetails = [
                'recipeID'        => $recipeID,
                'requiredItemIDs' => [],
                'requiredAmounts' => [],
                'baseSellPrices'  => [],
                'baseBuyPrices'   => [],
                'itemNames'       => [],
                'rank'            => (int)str_replace('Rank ', '', $spellData['Rank']),
            ];

            foreach ($spellData['Reagents'] as $reagents) {
                $spellDetails['requiredItemIDs'][] = $reagents['Item'];
                $spellDetails['requiredAmounts'][] = (int)$reagents['ItemQty'];

                $reagentData = $AuctionCraftSniper->getWoWDBJSON('/item/' . $reagents['Item']);

                $spellDetails['itemNames'][]      = $reagentData['Name'];
                $spellDetails['baseSellPrices'][] = (int)$reagentData['SellPrice'];
                $spellDetails['baseBuyPrices'][]  = (int)$reagentData['BuyPrice'];
            }

            $recipeRequirements[] = $spellDetails;
        }
    }

    $AuctionCraftSniper->setRecipeRequirements($recipeRequirements);

    $success = 1;
}

echo json_encode(['success' => $success]);
