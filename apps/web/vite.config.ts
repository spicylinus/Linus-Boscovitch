import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/auth": "http://localhost:4000",
      "/billing": "http://localhost:4000",
      "/onboard": "http://localhost:4000",
      "/dashboard": "http://localhost:4000",
      "/approve": "http://localhost:4000",
      "/referral": "http://localhost:4000",
    },
  },
});
