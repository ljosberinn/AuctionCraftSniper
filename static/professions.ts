import professions from "./professions.json";

export type Profession = typeof professions[number];
export type SimpleProfession = Pick<
  Profession,
  "slug" | "name" | "id" | "media"
>;

export const allProfessions = professions;
export const simpleProfessions: SimpleProfession[] = professions.map(
  ({ slug, name, id, media }) => ({
    id,
    media,
    name,
    slug,
  })
);

export const professionMap = simpleProfessions.reduce<Record<string, number>>(
  (carry, profession) => {
    carry[profession.slug] = profession.id;
    return carry;
  },
  {}
);
