import type { NextApiResponse } from "next";

export const setExpires = (res: NextApiResponse, seconds: number): void => {
  res.setHeader("Expires", new Date(Date.now() + seconds).toUTCString());
};
