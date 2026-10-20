import { Navigate, Outlet } from "react-router-dom";
import { LoadErrorScreen, LoadingScreen } from "../components/FullPageMessage";
import { useHousehold } from "../features/household/household";
import { decideAccess } from "./access";
import { useAuth } from "./AuthContext";

/** Wraps every page of the app: only signed-in members or the demo get in. */
export default function RequireAccess() {
  const { status, signOut } = useAuth();
  const household = useHousehold();

  switch (decideAccess(status, household)) {
    case "wait":
      return <LoadingScreen />;
    case "login":
      return <Navigate to="/prijava" replace />;
    case "setup":
      return <Navigate to="/gazdinstvo/novo" replace />;
    case "error":
      return (
        <LoadErrorScreen
          onRetry={() => household.refetch()}
          onSignOut={() => signOut()}
        />
      );
    case "allow":
      return <Outlet />;
  }
}
