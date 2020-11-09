import type { NextComponentType, NextPageContext } from "next";
import type { NextRouter } from "next/router";

import { AuthContextProvider } from "../client/context/AuthContext";
import "../styles.css";

export type AppRenderProps = {
  pageProps: Record<string, unknown>;
  err?: Error;
  Component: NextComponentType<
    NextPageContext,
    Record<string, unknown>,
    Record<string, unknown>
  >;
  router: NextRouter;
};

// eslint-disable-next-line import/no-default-export
export default function App({
  Component,
  pageProps,
}: AppRenderProps): JSX.Element {
  return (
    <AuthContextProvider shouldAttemptReauthentication>
      <Component {...pageProps} />
    </AuthContextProvider>
  );
}
