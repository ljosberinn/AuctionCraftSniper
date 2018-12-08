<?php

require '../dependencies/headers.php';

$success = 0;

$expansionLevel = (int)($_GET['expansionLevel'] ?? 0);
$professionID   = (int)($_GET['professionID'] ?? 4);

if ($expansionLevel > 0 && $professionID !== 4) {

    require '../dependencies/class.AuctionCraftSniper.php';

    $AuctionCraftSniper = new AuctionCraftSniper();
    $professionID       = $AuctionCraftSniper->areValidProfessions([(int)$_GET['professionID']])[0];

    $AuctionCraftSniper->setExpansionLevel((int)$_GET['expansionLevel']);

    $recipeRequirements = [];

    foreach ($AuctionCraftSniper->getRecipeIDs($professionID) as $recipeID) {

        foreach ($AuctionCraftSniper->getWoWDBJSON('/item/' . $recipeID)['CreatedBySpellIDs'] as $spellID) {
            $spellData = $AuctionCraftSniper->getWoWDBJSON('/spell/' . $spellID);

            $spellDetails = [
                'recipeID'         => $recipeID,
                'requiredItemIDs'  => [],
                'requiredAmounts'  => [],
                'baseSellPrices'   => [],
                'baseBuyPrices'    => [],
                'itemNames'        => [],
                'producedQuantity' => 1,
                'rank'             => (int)str_replace('Rank ', '', $spellData['Rank']),
            ];

            foreach ($spellData['Reagents'] as $reagents) {
                $spellDetails['requiredItemIDs'][] = $reagents['Item'];
                $spellDetails['requiredAmounts'][] = (int)$reagents['ItemQty'];

                $reagentData = $AuctionCraftSniper->getWoWDBJSON('/item/' . $reagents['Item']);

                $spellDetails['itemNames'][]      = $reagentData['Name'];
                $spellDetails['baseSellPrices'][] = (int)$reagentData['SellPrice'];
                $spellDetails['baseBuyPrices'][]  = (int)$reagentData['BuyPrice'];
            }

            $spellDetails['producedQuantity'] = $spellData['Effects'][0]['BasePoints'];

            $recipeRequirements[] = $spellDetails;
        }
    }

    $AuctionCraftSniper->setRecipeRequirements($recipeRequirements);

    $success = 1;
}

echo json_encode(['success' => $success]);
