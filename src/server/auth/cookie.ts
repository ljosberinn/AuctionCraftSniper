import type { CookieSerializeOptions } from "cookie";
import { serialize, parse } from "cookie";
import type { IncomingMessage } from "http";
import type { NextApiRequest, NextApiResponse } from "next";

import type { User } from "../../client/context/AuthContext/types";
import {
  SESSION_LIFETIME,
  IS_PROD,
  SESSION_COOKIE_NAME,
  BATTLE_NET_STATE_COOKIE_NAME,
} from "../../constants";

const SET_COOKIE_HEADER = "Set-Cookie";

type SSRCompatibleRequest = NextApiRequest | IncomingMessage;

export const encryptSession = (session: object): string =>
  JSON.stringify(session);

/**
 * extracts & decrypts the session cookie, if existing
 */
export const getSession = (req: SSRCompatibleRequest): User | null => {
  const token = getSessionCookie(req);

  if (token) {
    try {
      return JSON.parse(token);
    } catch {
      return null;
    }
  }

  return null;
};

type NewCookieOptions = {
  name: string;
  value: string;
  options?: CookieSerializeOptions;
};

/**
 * Sets new cookies on the res object via `Set-Cookie`, respecting
 * previously set value(s)
 */
export const setCookie = (
  { name, value, options }: NewCookieOptions,
  res: NextApiResponse
): void => {
  const next = serialize(name, value, options);
  const previous = res.getHeader(SET_COOKIE_HEADER);

  if (!previous || typeof previous === "number") {
    return res.setHeader(SET_COOKIE_HEADER, next);
  }

  if (typeof previous === "string") {
    return res.setHeader(SET_COOKIE_HEADER, [previous, next]);
  }

  res.setHeader(SET_COOKIE_HEADER, previous.concat(next));
};

export const setSessionCookie = (token: string, res: NextApiResponse): void => {
  const options: CookieSerializeOptions = {
    expires: new Date(Date.now() + SESSION_LIFETIME),
    httpOnly: true,
    maxAge: SESSION_LIFETIME / 1000,
    path: "/",
    // required for OAuth2 to work instantly in FF
    sameSite: "lax",
    secure: IS_PROD,
  };

  setCookie(
    {
      name: SESSION_COOKIE_NAME,
      options,
      value: token,
    },
    res
  );
};

export const removeCookie = (name: string, res: NextApiResponse): void => {
  const options = {
    maxAge: -1,
    path: "/",
  };

  const value = "";

  setCookie({ name, options, value }, res);
};

export const parseCookies = (
  req: SSRCompatibleRequest
): Record<string, string> => {
  // For API Routes we don't need to parse the cookies.
  if ("cookies" in req) {
    return req.cookies;
  }

  // For pages we do need to parse the cookies.
  return parse(req.headers.cookie ?? "");
};

export const getSessionCookie = (req: SSRCompatibleRequest): string =>
  parseCookies(req)[SESSION_COOKIE_NAME];

export const setBattleNetStateCookie = (
  res: NextApiResponse,
  value: string
): void => {
  const options: CookieSerializeOptions = {
    expires: new Date(Date.now() + 60),
    httpOnly: true,
    maxAge: 600,
    path: "/",
    // required for OAuth2 to work instantly in FF
    sameSite: "lax",
    secure: IS_PROD,
  };

  setCookie(
    {
      name: BATTLE_NET_STATE_COOKIE_NAME,
      options,
      value,
    },
    res
  );
};

export const removeBattleNetStateCookie = (res: NextApiResponse): void => {
  removeCookie(BATTLE_NET_STATE_COOKIE_NAME, res);
};
