import { writeFileSync } from "fs";
import { resolve } from "path";

import { regions } from "../../src/bnet/api";
import type { Realm, RealmIndex, RealmMeta } from "../../src/bnet/realms";
import type { BattleNetRegion } from "../../src/client/context/AuthContext/types";
import { staticFolder, sleep, retrieveToken } from "./setup";

const getAllRealmsByRegion = async (
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

const getRealmDataByName = async (
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

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const token = await retrieveToken();

  const allRealms = [];

  for (const region of regions) {
    // eslint-disable-next-line no-await-in-loop
    const realms = await getAllRealmsByRegion(region, token);

    // eslint-disable-next-line no-await-in-loop
    const realmData = await Promise.all(
      realms.map(async (realm, index) => {
        // eslint-disable-next-line no-console
        console.time(`${region}-${realm.slug}`);

        await sleep(index * 15);

        const { region: regionMeta, ...rest } = await getRealmDataByName(
          realm.slug,
          region,
          token
        );

        const { key, ...trimmedRegionMeta } = { ...regionMeta, slug: region };

        // eslint-disable-next-line no-console
        console.timeEnd(`${region}-${realm.slug}`);

        return {
          ...rest,
          region: trimmedRegionMeta,
        };
      })
    );

    allRealms.push(realmData);
  }

  const targetPath = resolve(staticFolder, "realms.json");
  writeFileSync(targetPath, JSON.stringify(allRealms.flat()));
})();
