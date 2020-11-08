import { writeFileSync } from "fs";
import { resolve } from "path";

import type {
  Profession,
  ProfessionMeta,
  ProfessionOverview,
} from "../../src/bnet/recipes";
import { retrieveToken, staticFolder } from "./setup";

const excludedProfessions = new Set([
  182, // Herbalism
  393, // Skinning
  356, // Fishing
  794, // Archaeology
  2777, // Soul Cyphering,
  2787, // Abominable Stitching
  2791, // Ascension Crafting
]);

const omitIrrelevantProfessions = (professions: ProfessionMeta[]) =>
  professions.filter((profession) => !excludedProfessions.has(profession.id));

const getAllProfessionsByLocale = async (
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

const getProfessionDataByIdAndLocale = async (
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

const getProfessionImage = async (
  id: number,
  access_token: string
): Promise<string> => {
  const params = new URLSearchParams({
    access_token,
    namespace: "static-eu",
    region: "eu",
  }).toString();

  const baseUrl = `https://eu.api.blizzard.com/data/wow/media/profession/${id}`;
  const url = `${baseUrl}?${params}`;

  const response = await fetch(url);
  const json = await response.json();

  return json.assets[0].value;
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const token = await retrieveToken();

  const professionData = await getAllProfessionsByLocale("en_US", token);

  const professions = await Promise.all(
    professionData.professions.map(async (profession) => {
      const {
        _links,
        skill_tiers = [],
        ...rest
      } = await getProfessionDataByIdAndLocale(profession.id, "en_US", token);

      const media = await getProfessionImage(rest.id, token);

      const sanitizedSkillTiers = skill_tiers.map(({ key, ...rest }) => rest);
      const slug = profession.name.toLowerCase().split(" ").join("-");

      return {
        ...rest,
        media,
        skill_tiers: sanitizedSkillTiers,
        slug,
      };
    })
  );

  const targetPath = resolve(staticFolder, "professions.json");
  writeFileSync(targetPath, JSON.stringify(professions));
})();
