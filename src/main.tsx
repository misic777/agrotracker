import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "./i18n";
import "./index.css";
import App from "./App.tsx";
import { DataProvider } from "./storage/DataProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <DataProvider>
        <App />
      </DataProvider>
    </HashRouter>
  </StrictMode>,
);
