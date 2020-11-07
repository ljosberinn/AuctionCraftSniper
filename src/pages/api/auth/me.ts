import nextConnect from "next-connect";

import type { User } from "../../../client/context/AuthContext/types";
import { getSession } from "../../../server/auth/cookie";
import type { RequestHandler } from "../../../server/auth/types";
import { UNAUTHORIZED } from "../../../utils/statusCodes";

const handler: RequestHandler<User> = (req, res) => {
  try {
    const session = getSession(req);

    if (session) {
      return res.json(session);
    }

    return res.status(UNAUTHORIZED).end();
  } catch {
    return res.status(UNAUTHORIZED).end();
  }
};

// eslint-disable-next-line import/no-default-export
export default nextConnect().get(handler);
