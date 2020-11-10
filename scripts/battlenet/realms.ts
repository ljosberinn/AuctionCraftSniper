import { writeFileSync } from "fs";
import { resolve } from "path";

import { regions } from "../../src/bnet/api";
import type { Realm, RealmIndex, RealmMeta } from "../../src/bnet/realms";
import type { BattleNetRegion } from "../../src/client/context/AuthContext/types";
import { staticFolder, retrieveToken, fetchWithRetry, locale } from "./setup";

const getAllRealmsByRegion = async (
  region: BattleNetRegion,
  access_token: string
): Promise<Omit<Realm, "key">[]> => {
  const params = new URLSearchParams({
    access_token,
    locale,
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

const getRealmDataByName = async (
  name: string,
  region: BattleNetRegion,
  access_token: string
): Promise<Omit<RealmMeta, "_links">> => {
  const params = new URLSearchParams({
    access_token,
    locale,
    namespace: `dynamic-${region}`,
  }).toString();

  const baseUrl = `https://${region}.api.blizzard.com/data/wow/realm/${name}`;
  const url = `${baseUrl}?${params}`;

  const response = await fetch(url);
  const { _links, ...rest }: RealmMeta = await response.json();

  return rest;
};

const connectedRealmRegEx = /\d{1,4}/gu;

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const token = await retrieveToken();

  const allRealms = [];

  for (const region of regions) {
    // eslint-disable-next-line no-await-in-loop
    const realms = await getAllRealmsByRegion(region, token);

    // eslint-disable-next-line no-await-in-loop
    const realmData = await Promise.all(
      realms.map(async (realm) => {
        // eslint-disable-next-line no-console
        console.time(`${region}-${realm.slug}`);

        const {
          region: regionMeta,
          is_tournament,
          connected_realm,
          ...rest
        } = await fetchWithRetry(() =>
          getRealmDataByName(realm.slug, region, token)
        );

        const { key, id, ...trimmedRegionMeta } = {
          ...regionMeta,
          slug: region,
        };

        const connectedRealmMatch = connected_realm.href.match(
          connectedRealmRegEx
        );

        if (!connectedRealmMatch || connectedRealmMatch.length === 0) {
          throw new Error("no connected realm id found");
        }

        const connectedRealmId = Number.parseInt(connectedRealmMatch[0]);

        // eslint-disable-next-line no-console
        console.timeEnd(`${region}-${realm.slug}`);

        if (!is_tournament) {
          return {
            ...rest,
            connectedRealmId,
            region: trimmedRegionMeta,
          };
        }
      })
    );

    allRealms.push(realmData);
  }

  const targetPath = resolve(staticFolder, "realms.json");
  writeFileSync(targetPath, JSON.stringify(allRealms.flat()));
})();
