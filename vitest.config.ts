import { defineConfig } from "vitest/config";

// Separate from vite.config.ts on purpose: that config wires up the
// TanStack Start / Nitro server plugins — none of that is relevant to (or
// safe to run during) plain unit tests of pure functions. Native
// tsconfig-paths resolution alone is enough to resolve the app's "@/*" imports.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
