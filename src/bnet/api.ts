import type { BattleNetRegion } from "../client/context/AuthContext/types";

export const regions: BattleNetRegion[] = ["us", "eu"];

export const isBattleNetRegion = (
  maybeRegion: string
  // @ts-expect-error silly
): maybeRegion is BattleNetRegion => regions.includes(maybeRegion);

const btoa = (str: string) => Buffer.from(str).toString("base64");

export const retrieveToken = async (): Promise<string> => {
  if (
    !process.env.BATTLENET_CLIENT_ID ||
    !process.env.BATTLENET_CLIENT_SECRET
  ) {
    throw new Error("missing battle net credentials");
  }

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    authorization: `Basic ${btoa(
      `${process.env.BATTLENET_CLIENT_ID}:${process.env.BATTLENET_CLIENT_SECRET}`
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
