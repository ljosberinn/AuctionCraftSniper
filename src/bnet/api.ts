import type { BattleNetRegion } from "../client/context/AuthContext/types";
import { BATTLENET_CLIENT_ID, BATTLENET_CLIENT_SECRET } from "../constants";
import type { Realm, RealmIndex, RealmMeta } from "./realms";

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
