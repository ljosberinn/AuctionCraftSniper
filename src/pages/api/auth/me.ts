import nextConnect from "next-connect";

import type { User } from "../../../client/context/AuthContext/types";
import { SESSION_LIFETIME } from "../../../constants";
import { getSession } from "../../../server/auth/cookie";
import type { RequestHandler } from "../../../server/auth/types";
import { setExpires } from "../../../server/utils";
import { UNAUTHORIZED } from "../../../utils/statusCodes";

/**
 * request is cacheable until shortly before expiration
 */
const expiration = SESSION_LIFETIME / 1000 - 60;

const handler: RequestHandler<User> = (req, res) => {
  try {
    const session = getSession(req);

    if (session) {
      setExpires(res, expiration);

      return res.json(session);
    }

    return res.status(UNAUTHORIZED).end();
  } catch {
    return res.status(UNAUTHORIZED).end();
  }
};

// eslint-disable-next-line import/no-default-export
export default nextConnect().get(handler);
