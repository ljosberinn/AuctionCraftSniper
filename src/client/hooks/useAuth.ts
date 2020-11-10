import { useContext } from "react";

import { AuthContext } from "../context/AuthContext";
import type { AuthContextDefinition } from "../context/AuthContext/types";

export function useAuth(): AuthContextDefinition {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth was called outside of an AuthContextProvider.");
  }

  return ctx;
}
