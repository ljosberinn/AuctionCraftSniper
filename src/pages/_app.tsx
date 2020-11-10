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
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight text-gray-900">~~</h1>
        </div>
      </header>
      <main className="bg-gray-200">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-300 rounded-lg h-96">
              <Component {...pageProps} />
            </div>
          </div>
        </div>
      </main>
    </AuthContextProvider>
  );
}
