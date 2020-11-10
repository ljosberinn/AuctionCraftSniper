export type BattleNetRegion = "eu" | "us";

export type User = {};

export type AuthContextDefinition = {
  user: User | null;
  login: (region: BattleNetRegion) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};
