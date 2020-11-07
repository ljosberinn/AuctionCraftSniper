import type { Links, Self } from "./common";

export type ProfessionOverview = {
  _links: Links;
  professions: ProfessionMeta[];
};

export type ProfessionMeta = {
  key: Self;
  name: string;
  id: number;
};

export type Profession = {
  _links: Links;
  id: number;
  name: string;
  description: string;
  type: Type;
  media: Media;
  skill_tiers?: SkillTierOverview[];
};

export type Media = {
  key: Self;
  id: number;
};

export type SkillTierOverview = {
  key: Self;
  name: string;
  id: number;
};

export type Type = {
  type: string;
  name: string;
};

export type SkillTier = {
  _links: Links;
  id: number;
  name: string;
  minimum_skill_level: number;
  maximum_skill_level: number;
  categories?: Category[];
};

export type Category = {
  name: string;
  recipes: RecipeOverview[];
};

export type RecipeOverview = {
  key: Self;
  name: string;
  id: number;
};

export type Recipe = {
  _links: Links;
  id: number;
  name: string;
  media: Media;
  crafted_item?: Item;
  reagents?: Reagent[];
  crafted_quantity: CraftedQuantity;
};

export type Item = {
  key: Self;
  name: string;
  id: number;
};

export type CraftedQuantity = {
  minimum: number;
  maximum: number;
};

export type Reagent = {
  reagent: Item;
  quantity: number;
};

export type RecipeAssets = {
  id: number;
  _links: Links;
  assets: {
    file_data_id: number;
    key: "icon";
    value: string;
  }[];
};

export type CustomRecipe = {
  /**
   * @example 39023
   */
  id: Recipe["id"];
  /**
   * media url
   *
   * result of requesting `Media["key"]["href"]`
   */
  media: string;
  /**
   * crafted item id
   */
  craftedItem: Item["id"];
  /**
   * min max
   */
  craftedQuantity: CraftedQuantity;
  /**
   * reagents
   *
   * id array of Reagents
   */
  reagents: {
    id: Item["id"];
    quantity: Reagent["quantity"];
  }[];
  /**
   * @example Leatherworking === 165
   */
  professionId: Profession["id"];
  /**
   * categories have skill tiers
   *
   * for some reason these dont have ids. only a string
   *
   * @example Leatherworking > Legion Leatherworking > Leather Armor
   */
  category: Category["name"];
  /**
   * professions can have skill tiers
   *
   * @example Leatherworking > Legion Leatherworking
   */
  skillTier: Pick<
    SkillTier,
    "id" | "minimum_skill_level" | "maximum_skill_level"
  >;
};
/**
 * used to do `map[recipe.professionId]`
 */
export type ProfessionLocalization = Record<number, string>;

/**
 * used to do `map[recipe.craftedItem]` as well as for each reagent
 */
export type ItemLocalization = Record<number, string>;

/**
 * used to do `map[recipe.skillTier.id]
 */
export type SkillTierLocalization = Record<number, string>;

/**
 * used to do `map[recipe.id]`
 */
export type RecipeLocalization = Record<number, string>;
