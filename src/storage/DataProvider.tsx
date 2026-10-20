import type { ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import { createSampleFarm } from "../demo/sampleFarm";
import { useHousehold } from "../features/household/household";
import { currentLanguage } from "../i18n";
import { LocalDataProvider } from "./LocalDataProvider";
import { DEMO_DATA_KEY } from "./localStore";
import { SupabaseDataProvider } from "./SupabaseDataProvider";

/**
 * Picks where the data lives: the household's database when signed in,
 * this browser in the demo. The demo starts with a sample farm written in
 * the language selected when it was opened. Pages only ever use `useData()` and don't need
 * to know which one it is.
 *
 * Rendered inside RequireAccess, so a signed-in user always has a household.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const { data: household } = useHousehold();

  if (status === "signedIn" && household) {
    // key: a different household gets a completely fresh provider.
    return (
      <SupabaseDataProvider key={household.id} householdId={household.id}>
        {children}
      </SupabaseDataProvider>
    );
  }
  return (
    <LocalDataProvider
      storageKey={DEMO_DATA_KEY}
      createInitial={() => createSampleFarm(currentLanguage())}
    >
      {children}
    </LocalDataProvider>
  );
}
