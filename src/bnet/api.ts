import type { BattleNetRegion } from "../client/context/AuthContext/types";
import type { Recipe, RecipeAssets, SkillTier } from "./recipes";

export const regions: BattleNetRegion[] = ["us", "eu"];

export const getSkillTierDataByProfessionIdAndSkillTierIdAndLocale = async (
  professionId: number,
  skillTierId: number,
  locale: string,
  access_token: string
): Promise<SkillTier> => {
  const params = new URLSearchParams({
    access_token,
    locale,
    namespace: "static-eu",
    region: "eu",
  }).toString();

  const baseUrl = `https://eu.api.blizzard.com/data/wow/profession/${professionId}/skill-tier/${skillTierId}`;
  const url = `${baseUrl}?${params}`;

  const response = await fetch(url);
  return response.json();
};

export const getRecipeDataByIdAndLocale = async (
  recipeId: number,
  locale: string,
  access_token: string
): Promise<Recipe> => {
  const params = new URLSearchParams({
    access_token,
    locale,
    namespace: "static-eu",
    region: "eu",
  }).toString();

  const baseUrl = `https://eu.api.blizzard.com/data/wow/recipe/${recipeId}`;
  const url = `${baseUrl}?${params}`;

  const response = await fetch(url);
  return response.json();
};

export const getRecipeMediaUrl = async (
  id: number,
  locale: string,
  access_token: string
): Promise<RecipeAssets> => {
  const params = new URLSearchParams({
    access_token,
    locale,
    namespace: "static-eu",
    region: "eu",
  }).toString();

  const baseUrl = `https://eu.api.blizzard.com/data/wow/media/recipe/${id}`;
  const url = `${baseUrl}?${params}`;

  const response = await fetch(url);
  return response.json();
};
