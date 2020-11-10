import { loadEnvConfig } from "@next/env";
import fetch from "node-fetch";
import { resolve } from "path";

export { retrieveToken } from "../../src/bnet/api";

// @ts-expect-error required for other files
global.fetch = fetch;

const cwd = process.cwd();
loadEnvConfig(cwd);

export const staticFolder = resolve(cwd, "./static");
export const locale = "en_US";

export const sleep = (duration: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, duration);
  });

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
