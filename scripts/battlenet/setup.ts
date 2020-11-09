import { loadEnvConfig } from "@next/env";
import fetch from "node-fetch";
import { resolve } from "path";

// @ts-expect-error required for other files
global.fetch = fetch;

const cwd = process.cwd();
loadEnvConfig(cwd);

export const staticFolder = resolve(cwd, "./static");

export const sleep = (duration: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, duration);
  });

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

export const fetchWithRetry = async <T>(
  fetcher: () => Promise<T>,
  attempt = 1
): Promise<T> => {
  try {
    // eslint-disable-next-line no-await-in-loop
    return await fetcher();
  } catch {
    // eslint-disable-next-line no-console
    console.error(`attempt ${attempt} failed`);

    await sleep(attempt * 1000);

    return fetchWithRetry(fetcher, attempt + 1);
  }
};
