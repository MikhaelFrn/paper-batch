import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

export default defineConfig(({ command }) => ({
  // Fixed port + all-interfaces host so the dev server stays reachable from
  // another device on the LAN (e.g. a phone) at http://<your-machine-ip>:8080
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
  },
  plugins: [
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
      // Errors the build if client code ever imports a "server-only"-marked
      // module or anything under a server/ directory, instead of silently
      // bundling it.
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
    }),
    react(),
    // Build-only — the dev server doesn't need Nitro's deploy-preset step.
    // Defaults to a Cloudflare Worker bundle otherwise; pinned to Vercel's
    // Build Output API format (.vercel/output/functions/...) since that's
    // what's actually deployed.
    ...(command === "build" ? [nitro({ preset: "vercel" })] : []),
  ],
}));
