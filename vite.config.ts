import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // The Lovable config wrapper defaults nitro to the `cloudflare-module`
  // preset (see node_modules/@lovable.dev/vite-tanstack-config's own
  // docs) — confirmed live that a plain `npm run build` produces a
  // Cloudflare Worker bundle (.output/server/wrangler.json), not
  // something Vercel can run. Pinning the preset explicitly, rather than
  // relying on Nitro's env-based auto-detection, since the wrapper's docs
  // also warn the preset can be *forced* to Cloudflare inside a Lovable
  // build regardless of auto-detection — explicit is the only path
  // verified to actually produce Vercel's Build Output API format
  // (.vercel/output/functions/...).
  nitro: {
    preset: "vercel",
  },
});
