import { writeFileSync } from "fs";
import { resolve } from "path";

import type {
  CustomRecipe,
  Item,
  Recipe,
  MediaAssets,
  SkillTier,
} from "../../src/bnet/recipes";
import allProfessions from "../../static/professions.json";
import { retrieveToken, fetchWithRetry, staticFolder } from "./setup";

const getSkillTierDataByProfessionIdAndSkillTierId = async (
  professionId: number,
  skillTierId: number,
  access_token: string
): Promise<SkillTier> => {
  const params = new URLSearchParams({
    access_token,
    locale: "en_US",
    namespace: "static-eu",
    region: "eu",
  }).toString();

  const baseUrl = `https://eu.api.blizzard.com/data/wow/profession/${professionId}/skill-tier/${skillTierId}`;
  const url = `${baseUrl}?${params}`;

  const response = await fetch(url);
  return response.json();
};

const getRecipeDataByIdAndLocale = async (
  recipeId: number,
  access_token: string
): Promise<Recipe> => {
  const params = new URLSearchParams({
    access_token,
    locale: "en_US",
    namespace: "static-eu",
    region: "eu",
  }).toString();

  const baseUrl = `https://eu.api.blizzard.com/data/wow/recipe/${recipeId}`;
  const url = `${baseUrl}?${params}`;

  const response = await fetch(url);
  return response.json();
};

const getRecipeMediaUrl = async (
  id: number,
  access_token: string
): Promise<MediaAssets> => {
  const params = new URLSearchParams({
    access_token,
    locale: "en_US",
    namespace: "static-eu",
    region: "eu",
  }).toString();

  const baseUrl = `https://eu.api.blizzard.com/data/wow/media/recipe/${id}`;
  const url = `${baseUrl}?${params}`;

  const response = await fetch(url);
  return response.json();
};

const getItemMediaUrl = async (
  id: number,
  access_token: string
): Promise<MediaAssets> => {
  const params = new URLSearchParams({
    access_token,
    locale: "en_US",
    namespace: "static-eu",
    region: "eu",
  }).toString();

  const baseUrl = `https://eu.api.blizzard.com/data/wow/media/item/${id}`;
  const url = `${baseUrl}?${params}`;

  const response = await fetch(url);
  return response.json();
};

const getRecipeMedia = (data: MediaAssets) => data.assets[0].value;

const recipeSkiplist = new Set<number>([
  // inscription
  40_353, // Blood Contract: Sacrifice
  40_377, // Blood Contract: BloodGuard
  40_378, // Blood Contract: Bloodshet
  40_379, // Blood Contract: Oblivion
  // tailoring
  24_786, // Release Fire Spirit
]);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const token = await retrieveToken();

  for (const profession of allProfessions) {
    // eslint-disable-next-line no-console
    console.time(profession.name);
    const skillTierData = [];
    const allRecipes = [];

    for (const skillTier of profession.skill_tiers) {
      // eslint-disable-next-line no-console
      console.time(`> ${profession.name} - ${skillTier.name}`);

      const {
        _links,
        categories = [],
        ...rest
        // eslint-disable-next-line no-await-in-loop
      } = await getSkillTierDataByProfessionIdAndSkillTierId(
        profession.id,
        skillTier.id,
        token
      );

      const rawRecipes = categories.flatMap((category) => {
        return category.recipes
          .filter((recipe) => !recipeSkiplist.has(recipe.id))
          .map(({ key, ...rest }) => {
            return {
              ...rest,
              category: category.name,
            };
          });
      });

      // eslint-disable-next-line no-await-in-loop
      const recipes: CustomRecipe[] = await Promise.all(
        rawRecipes.map(async (recipe) => {
          const {
            _links,
            media,
            crafted_item,
            horde_crafted_item,
            alliance_crafted_item,
            reagents = [],
            modified_crafting_slots,
            ...rest
          } = await fetchWithRetry(() =>
            getRecipeDataByIdAndLocale(recipe.id, token)
          );

          const isFactionDependantItem =
            horde_crafted_item && alliance_crafted_item;

          const mediaData = isFactionDependantItem
            ? null
            : getRecipeMedia(
                await fetchWithRetry(() => getRecipeMediaUrl(recipe.id, token))
              );

          const sanitizedReagents = reagents.map(
            ({ quantity, reagent: { id, name } }) => ({
              id,
              name,
              quantity,
            })
          );

          const alliance = alliance_crafted_item
            ? await getFactionItem(alliance_crafted_item, token)
            : null;

          const horde = horde_crafted_item
            ? await getFactionItem(horde_crafted_item, token)
            : null;

          const craftingSlots = modified_crafting_slots
            ? modified_crafting_slots.map(({ display_order, slot_type }) => ({
                display_order,
                slot_type: slot_type.id,
              }))
            : null;

          return {
            ...rest,
            alliance,
            horde,
            media: mediaData,
            modified_crafting_slots: craftingSlots,
            reagents: sanitizedReagents,
            skillTierId: skillTier.id,
          };
        })
      );

      // eslint-disable-next-line no-console
      console.timeEnd(`> ${profession.name} - ${skillTier.name}`);

      skillTierData.push(rest);
      allRecipes.push(recipes);
    }

    const skillTierDataPath = resolve(
      staticFolder,
      `${profession.slug}-skill-tiers.json`
    );
    writeFileSync(skillTierDataPath, JSON.stringify(skillTierData));

    const recipesPath = resolve(
      staticFolder,
      `${profession.slug}-recipes.json`
    );
    writeFileSync(recipesPath, JSON.stringify(allRecipes.flat()));

    // eslint-disable-next-line no-console
    console.timeEnd(profession.name);
  }
})();

const getFactionItem = async (item: Item, token: string) => {
  const mediaData = await fetchWithRetry(() => getItemMediaUrl(item.id, token));

  return {
    id: item.id,
    media: getRecipeMedia(mediaData),
    name: item.name,
  };
};
