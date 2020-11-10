import nextConnect from "next-connect";

import { SESSION_COOKIE_NAME } from "../../../constants";
import { removeCookie } from "../../../server/auth/cookie";
import type { RequestHandler } from "../../../server/auth/types";

const handler: RequestHandler = (_, res) => {
  removeCookie(SESSION_COOKIE_NAME, res);

  res.end();
};

// eslint-disable-next-line import/no-default-export
export default nextConnect().delete(handler);
