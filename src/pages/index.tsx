import { useAuth } from "../client/hooks/useAuth";

// eslint-disable-next-line import/no-default-export
export default function Index(): JSX.Element {
  const { user, isAuthenticated, login, logout } = useAuth();

  return (
    <>
      <button
        onClick={isAuthenticated ? logout : () => login("eu")}
        type="button"
      >
        {isAuthenticated ? "logout" : "login"}
      </button>
      <hr />
      {JSON.stringify(user)}
    </>
  );
}
