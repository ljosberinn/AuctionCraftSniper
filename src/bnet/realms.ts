import type { Links, Self } from "./common";

/**
 * @see /data/wow/realm/index
 */
export type RealmIndex = {
  realms: Realm[];
  _links: Links;
};

export type Realm = {
  key: Self;
  slug: string;
  id: number;
  name: string;
};

/**
 * @see /data/wow/realm/{realmSlug}
 */
export type RealmMeta = {
  _links: Links;
  id: number;
  region: {
    key: Self;
    name: string;
    id: number;
  };
  connected_realm: Self;
  name: string;
  category: string;
  locale: string;
  timezone: string;
  type: {
    type: string;
    name: string;
  };
  is_tournament: boolean;
  slug: string;
};
