/**
 * @see /data/wow/realm/index
 */
export type RealmIndex = {
  realms: Realm[];
  _links: {
    self: {
      href: string;
    };
  };
};

export type Realm = {
  key: {
    href: string;
  };
  slug: string;
  id: number;
  name: string;
};

/**
 * @see /data/wow/realm/{realmSlug}
 */
export type RealmMeta = {
  _links: {
    self: {
      href: string;
    };
  };
  id: number;
  region: {
    key: {
      href: string;
    };
    name: string;
    id: number;
  };
  connected_realm: {
    href: string;
  };
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
