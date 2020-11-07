import type { BattleNetRegion } from "../client/context/AuthContext/types";
import { BATTLENET_CLIENT_ID, BATTLENET_CLIENT_SECRET } from "../constants";
import type { Realm, RealmIndex, RealmMeta } from "./realms";
import type {
  Profession,
  ProfessionMeta,
  ProfessionOverview,
  Recipe,
  RecipeAssets,
  SkillTier,
} from "./recipes";

const btoa = (str: string) => Buffer.from(str).toString("base64");

export const regions: BattleNetRegion[] = ["us", "eu"];

export const retrieveToken = async (): Promise<string> => {
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    authorization: `Basic ${btoa(
      `${BATTLENET_CLIENT_ID}:${BATTLENET_CLIENT_SECRET}`
    )}`,
  };

  const body = new URLSearchParams({
    grant_type: "client_credentials",
  }).toString();

  const response = await fetch("https://eu.battle.net/oauth/token", {
    body,
    headers,
    method: "POST",
  });

  if (response.ok) {
    const { access_token } = await response.json();

    return access_token;
  }

  throw new Error("oauth2: could not authenticate");
};

export const getAllRealmsByRegion = async (
  region: BattleNetRegion,
  access_token: string
): Promise<Omit<Realm, "key">[]> => {
  const params = new URLSearchParams({
    access_token,
    locale: "en_US",
    namespace: `dynamic-${region}`,
  }).toString();

  const baseUrl = `https://${region}.api.blizzard.com/data/wow/realm/index`;
  const url = `${baseUrl}?${params}`;

  const response = await fetch(url);
  const rawRealms: RealmIndex = await response.json();

  return rawRealms.realms
    .map((realm) => {
      const { key, ...rest } = realm;

      return rest;
    })
    .sort((a, b) => (a.slug > b.slug ? 1 : -1));
};

export const getRealmDataByName = async (
  name: string,
  region: BattleNetRegion,
  access_token: string
): Promise<Omit<RealmMeta, "_links">> => {
  const params = new URLSearchParams({
    access_token,
    locale: "en_US",
    namespace: `dynamic-${region}`,
  }).toString();

  const baseUrl = `https://${region}.api.blizzard.com/data/wow/realm/${name}`;
  const url = `${baseUrl}?${params}`;

  const response = await fetch(url);
  const { _links, ...rest }: RealmMeta = await response.json();

  return rest;
};

const omitIrrelevantProfessions = (professions: ProfessionMeta[]) => {
  const excludedIds = new Set([
    182, // Herbalism
    303, // Skinning
    356, // Fishing
    794, // Archaeology
    2777, // Soul Cyphering,
    2787, // Abominable Stitching
    2791, // Ascension Crafting
  ]);

  return professions.filter((profession) => !excludedIds.has(profession.id));
};

export const getAllProfessionsByLocale = async (
  locale: string,
  access_token: string
): Promise<ProfessionOverview> => {
  const params = new URLSearchParams({
    access_token,
    locale,
    namespace: "static-eu",
    region: "eu",
  }).toString();

  const baseUrl = `https://eu.api.blizzard.com/data/wow/profession/index`;
  const url = `${baseUrl}?${params}`;

  const response = await fetch(url);
  const json: ProfessionOverview = await response.json();

  return {
    ...json,
    professions: omitIrrelevantProfessions(json.professions),
  };
};

export const getProfessionDataByIdAndLocale = async (
  id: number,
  locale: string,
  access_token: string
): Promise<Profession> => {
  const params = new URLSearchParams({
    access_token,
    locale,
    namespace: "static-eu",
    region: "eu",
  }).toString();

  const baseUrl = `https://eu.api.blizzard.com/data/wow/profession/${id}`;
  const url = `${baseUrl}?${params}`;

  const response = await fetch(url);
  return response.json();
};

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
