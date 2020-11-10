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
  reagents?: Reagent[];
  crafted_quantity: CraftedQuantity;
  crafted_item?: Item;
  alliance_crafted_item?: Item;
  horde_crafted_item?: Item;
  modified_crafting_slots?: ModifiedCraftingSlot[];
  description: string;
};

export type ModifiedCraftingSlot = {
  slot_type: SlotType;
  display_order: number;
};

export type CustomRecipe = {
  id: number;
  skillTierId: number;
  name: string;
  description?: string;
  crafted_quantity: {
    value?: number;
    minimum?: number;
    maximum?: number;
  };
  alliance: {
    id: number;
    name: string;
    media: null | string;
  } | null;
  horde: {
    id: number;
    name: string;
    media: null | string;
  } | null;
  media: null | string;
  reagents: { id: number; quantity: number; name: string }[];
  modified_crafting_slots:
    | null
    | {
        slot_type: number;
        display_order: number;
      }[];
  rank?: number;
};

export type SlotType = {
  key: Self;
  id: number;
  name: string;
};

export type Item = {
  key: Self;
  name: string;
  id: number;
};

export type CraftedQuantity = {
  minimum?: number;
  maximum?: number;
  value: number;
};

export type Reagent = {
  reagent: Item;
  quantity: number;
  key: Self;
};

export type MediaAssets = {
  id: number;
  _links: Links;
  assets: {
    file_data_id: number;
    key: "icon";
    value: string;
  }[];
};

export type OuterAuctionData = {
  auctions: Auction[];
  connected_realm: Self;
  _links: Self;
};

export type Auction = {
  id: number;
  item: AuctionItem;
  quantity: number;
  unit_price: number;
  time_left: "VERY_LONG" | "SHORT" | "MEDIUM" | "LONG";
  buyout?: number;
  bid?: number;
};

export type Modifier = {
  type: number;
  value: number;
};

export type AuctionItem = {
  id: number;
  context?: number;
  bonus_lists: number[];
  modifiers: Modifier[];
  pet_breed_id?: number;
  pet_level?: number;
  pet_quality_id?: number;
  pet_species_id?: number;
};

export type AuctionPartial = Pick<
  Auction,
  "item" | "bid" | "buyout" | "quantity" | "id"
>;
