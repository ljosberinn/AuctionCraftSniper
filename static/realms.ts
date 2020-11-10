import type { BattleNetRegion } from "../src/client/context/AuthContext/types";
import allRealms from "./realms.json";

export type Realm = typeof allRealms[number];

export type SimpleRealm = {
  id: number;
  name: string;
  region: BattleNetRegion;
  slug: string;
  connectedRealmId: number;
};

export const simpleRealms: SimpleRealm[] = allRealms.map(
  ({ name, slug, id, region, connectedRealmId }) => ({
    connectedRealmId,
    id,
    name,
    region: region.slug as BattleNetRegion,
    slug,
  })
);
