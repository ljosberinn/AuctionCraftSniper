import Router from "next/router";
import type { SetStateAction, Dispatch } from "react";
import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  createContext,
} from "react";

import type { WithChildren } from "../../types";
import type { User, AuthContextDefinition, BattleNetRegion } from "./types";

export type AuthContextProviderProps = WithChildren<{
  shouldAttemptReauthentication?: boolean;
  redirectDestinationIfUnauthenticated?: string;
}>;

export const AuthContext = createContext<AuthContextDefinition | null>(null);

export function AuthContextProvider({
  children,
  shouldAttemptReauthentication = false,
  redirectDestinationIfUnauthenticated,
}: AuthContextProviderProps): JSX.Element {
  const [user, setUser] = useState<User | null>(null);

  useSSGReauthentication({
    redirectDestinationIfUnauthenticated,
    setUser,
    shouldAttemptReauthentication,
    user,
  });

  const login = useCallback((region: BattleNetRegion) => {
    window.location.assign(`/api/auth/battlenet?init&region=${region}`);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "DELETE" });

    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: !!user,
      login,
      logout,
      user,
    }),
    [login, logout, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

type UseSSGReauthenticationArgs = Pick<
  AuthContextProviderProps,
  "redirectDestinationIfUnauthenticated" | "shouldAttemptReauthentication"
> & {
  setUser: Dispatch<SetStateAction<User | null>>;
  user: User | null;
};

function useSSGReauthentication({
  shouldAttemptReauthentication,
  redirectDestinationIfUnauthenticated,
  setUser,
  user,
}: UseSSGReauthenticationArgs) {
  useEffect(() => {
    /**
     * do not attempt to reauthenticate if
     * - categorically ruled out
     * - already authenticated
     */
    if (!shouldAttemptReauthentication || user) {
      return;
    }

    async function redirectOnFailure() {
      if (!redirectDestinationIfUnauthenticated) {
        return;
      }

      try {
        await Router.push(redirectDestinationIfUnauthenticated);
      } catch {
        window.location.assign(redirectDestinationIfUnauthenticated);
      }
    }

    async function reauthenticate() {
      try {
        const response = await fetch("/api/auth/me");

        if (response.ok) {
          const json = await response.json();

          setUser(json);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          redirectOnFailure();
        }
      } catch {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        redirectOnFailure();
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    reauthenticate();
  }, [
    shouldAttemptReauthentication,
    redirectDestinationIfUnauthenticated,
    setUser,
    user,
  ]);
}
