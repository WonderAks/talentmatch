import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/lib/api.ts", "src/lib/auth.ts"],
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
    },
  },
});