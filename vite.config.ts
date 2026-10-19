/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/agrotracker/",
  test: {
    // A simulated browser (document, localStorage) so code that touches
    // the browser can be tested in Node.
    environment: "jsdom",
  },
});
