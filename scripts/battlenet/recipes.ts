import { writeFileSync } from "fs";
import { resolve } from "path";

import type { Recipe, RecipeAssets, SkillTier } from "../../src/bnet/recipes";
import allProfessions from "../../static/professions.json";
import { retrieveToken, sleep, staticFolder } from "./setup";

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
): Promise<RecipeAssets> => {
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

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const token = await retrieveToken();

  for (const profession of allProfessions) {
    // eslint-disable-next-line no-console
    console.time(profession.name);
    const skillTierData = [];

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
        return category.recipes.map(({ key, ...rest }) => {
          return {
            ...rest,
            category: category.name,
          };
        });
      });

      // eslint-disable-next-line no-await-in-loop
      const recipes = await Promise.all(
        rawRecipes.map(async (recipe, recipeIndex) => {
          // TODO retry
          await sleep(100 * recipeIndex);

          const { _links, media, ...rest } = await getRecipeDataByIdAndLocale(
            recipe.id,
            token
          );
          const mediaData = await getRecipeMediaUrl(recipe.id, token);

          return {
            ...rest,
            media: mediaData.assets[0].value,
          };
        })
      );

      // eslint-disable-next-line no-console
      console.timeEnd(`> ${profession.name} - ${skillTier.name}`);

      skillTierData.push({
        ...rest,
        recipes,
      });
    }

    const path = resolve(staticFolder, `${profession.slug}.json`);
    writeFileSync(path, JSON.stringify(skillTierData));

    // eslint-disable-next-line no-console
    console.timeEnd(profession.name);
  }
})();
