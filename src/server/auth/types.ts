import type { NextApiResponse, NextApiRequest } from "next";
import type {
  RequestHandler as NextConnectRequestHandler,
  Middleware as NextConnectMiddleware,
} from "next-connect";

export type Middleware<
  ReturnType = undefined,
  ExtendedApiRequest = {}
> = NextConnectMiddleware<
  NextApiRequest & ExtendedApiRequest,
  NextApiResponse<ReturnType>
>;

export type RequestHandler<
  ReturnType = undefined,
  ExtendedApiRequest = {}
> = NextConnectRequestHandler<
  // allows overwriting e.g. query
  NextApiRequest & ExtendedApiRequest,
  NextApiResponse<ReturnType>
>;

export type OAuth2GetParams<Params = {}> = Params & {
  redirect_uri: string;
  code: string;
  client_id: string;
  client_secret: string;
};

export type OAuth2Response = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
};
