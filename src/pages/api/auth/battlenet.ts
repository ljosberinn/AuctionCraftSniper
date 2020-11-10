import type { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";

import type { BattleNetRegion } from "../../../client/context/AuthContext/types";
import {
  BATTLENET_CLIENT_ID,
  BATTLENET_CLIENT_SECRET,
  BATTLE_NET_STATE_COOKIE_NAME,
} from "../../../constants";
import {
  encryptSession,
  removeBattleNetStateCookie,
  setBattleNetStateCookie,
  setSessionCookie,
} from "../../../server/auth/cookie";
import type { RequestHandler } from "../../../server/auth/types";
import { getOAuth2Data, getOrigin, redirect } from "../../../server/auth/utils";
import {
  BAD_REQUEST,
  FOUND_MOVED_TEMPORARILY,
  INTERNAL_SERVER_ERROR,
} from "../../../utils/statusCodes";

type ExpectedQueryParams = {
  init?: string;
  __nextLocale: string;
  region?: BattleNetRegion;
  // only present if in callback from external provider
  code?: string;
  error?: string;
  state?: string;
};

const isValidRegion = (region: string): region is BattleNetRegion =>
  ["eu", "us", "apac", "cn"].includes(region);

const scope = ["wow.profile"].join(" ");
const client_id = BATTLENET_CLIENT_ID;
const client_secret = BATTLENET_CLIENT_SECRET;

const getAccessTokenUrl = (region: BattleNetRegion) =>
  `https://${region}.battle.net/oauth/token`;

const handleCallback = async (
  req: NextApiRequest,
  res: NextApiResponse,
  redirect_uri: string
) => {
  const { code, state, error } = req.query as ExpectedQueryParams;

  if (!code || Array.isArray(code) || error) {
    if (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }

    res.status(BAD_REQUEST).end();
    return;
  }

  const origin = getOrigin(req);

  const [region, persistedState] =
    req.cookies[BATTLE_NET_STATE_COOKIE_NAME]?.split("-") ?? "";

  if (
    !region ||
    Array.isArray(region) ||
    !isValidRegion(region) ||
    // state must be present
    !state ||
    Array.isArray(state) ||
    // just like persisted state
    !persistedState ||
    // and match
    !state.startsWith(region) ||
    !state.endsWith(persistedState)
  ) {
    res.status(BAD_REQUEST);

    return null;
  }

  removeBattleNetStateCookie(res);

  const url = getAccessTokenUrl(region);

  try {
    const oauthResponse = await getOAuth2Data<{ region: BattleNetRegion }>(
      url,
      {
        client_id,
        client_secret,
        code,
        redirect_uri,
        region,
      }
    );

    const profile = {
      ...oauthResponse,
      expires_at: Date.now() + oauthResponse.expires_in * 1000,
    };

    res.status(profile ? FOUND_MOVED_TEMPORARILY : INTERNAL_SERVER_ERROR);

    if (profile) {
      const token = encryptSession(profile);
      setSessionCookie(token, res);

      res.setHeader("Location", origin);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};

const handler: RequestHandler = async (req, res) => {
  const { region } = req.query as ExpectedQueryParams;
  const origin = getOrigin(req);
  const redirect_uri = `${origin}/api/auth/battlenet`;

  if ("init" in req.query) {
    if (!region || Array.isArray(region) || !isValidRegion(region)) {
      res.status(BAD_REQUEST).end();
      return;
    }

    const upcomingState = `${region}-${Math.floor(
      Math.random() * 100 ** Math.PI
    )}`;

    setBattleNetStateCookie(res, upcomingState);

    const url = `https://${region}.battle.net/oauth/authorize`;

    redirect(res, url, {
      client_id,
      redirect_uri,
      scope,
      state: upcomingState,
    });

    res.end();
    return;
  }

  await handleCallback(req, res, redirect_uri);

  res.end();
};

// eslint-disable-next-line import/no-default-export
export default nextConnect().use(handler);
