import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

// Previously went through @lovable.dev/vite-tanstack-config, which just
// fanned one grouped config object out into this same plugin list, plus a
// few Lovable-sandbox-only plugins (HMR bridge, dev-server error loggers,
// asset proxy) that only ever did anything inside Lovable's own preview
// iframe — dropped along with the wrapper, not replaced, now that this
// project isn't edited there anymore.
export default defineConfig(({ command }) => ({
  // Fixed port + all-interfaces host so the dev server stays reachable from
  // another device on the LAN (e.g. a phone) at http://<your-machine-ip>:8080
  // — matches what the Lovable wrapper used to set for its own sandbox,
  // kept here as a plain preference now that nothing detects that sandbox.
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
      // The wrapper's own default, kept: errors the build if client code
      // ever imports a "server-only"-marked module or anything under a
      // server/ directory, instead of silently bundling it.
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
    }),
    react(),
    // Build-only, matching the wrapper's own gating (confirmed in its
    // source) — the dev server doesn't need Nitro's deploy-preset step.
    // Defaults to a Cloudflare Worker bundle otherwise; pinned to Vercel's
    // Build Output API format (.vercel/output/functions/...) since that's
    // what's actually deployed.
    ...(command === "build" ? [nitro({ preset: "vercel" })] : []),
  ],
}));
