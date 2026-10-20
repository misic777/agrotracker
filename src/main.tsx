import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider.tsx";
import "./i18n";
import "./index.css";
import App from "./App.tsx";
import { DataProvider } from "./storage/DataProvider.tsx";

/** Cache for data loaded from Supabase (see TanStack Query). */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data counts as fresh for a minute; switching pages doesn't reload it.
      staleTime: 60_000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HashRouter>
  </StrictMode>,
);
