import type { CustomRecipe } from "../src/bnet/recipes";
// import alchemyRecipes from "./alchemy-recipes.json";
import blacksmithingRecipes from "./blacksmithing-recipes.json";
// import cookingRecipes from "./cooking-recipes.json";
import enchantingRecipes from "./enchanting-recipes.json";
import engineeringRecipes from "./engineering-recipes.json";
import inscriptionRecipes from "./inscription-recipes.json";
// import jewelcraftingRecipes from "./jewelcrafting-recipes.json";
import leatherworkingRecipes from "./leatherworking-recipes.json";
// import miningRecipes from "./mining-recipes.json";
import { professionMap } from "./professions";
import tailoringRecipes from "./tailoring-recipes.json";

export const allRecipes: CustomRecipe[] = [
  // ...alchemyRecipes, // TODO
  ...blacksmithingRecipes,
  // ...cookingRecipes, // TODO
  ...enchantingRecipes,
  ...engineeringRecipes,
  ...inscriptionRecipes,
  // ...jewelcraftingRecipes, // TODO
  ...leatherworkingRecipes,
  // ...miningRecipes, // TODO
  ...tailoringRecipes,
].sort((a, b) => (a.id > b.id ? 1 : -1));

export const recipeMap: Record<string, CustomRecipe[]> = {
  [professionMap.blacksmithing]: blacksmithingRecipes,
  [professionMap.enchanting]: enchantingRecipes,
  [professionMap.engineering]: engineeringRecipes,
  [professionMap.inscription]: inscriptionRecipes,
  [professionMap.leatherworking]: leatherworkingRecipes,
  [professionMap.tailoring]: tailoringRecipes,
};

const unique = (arr: number[]) => [...new Set(arr)];

export const allCraftedItemIds: number[] = unique(
  allRecipes.flatMap((recipe) => {
    if (recipe.alliance && recipe.horde) {
      return [recipe.alliance.id, recipe.horde.id];
    }

    return recipe.id;
  })
);

export const allReagentIds: number[] = unique(
  allRecipes.flatMap((recipe) => recipe.reagents.map((reagent) => reagent.id))
);
