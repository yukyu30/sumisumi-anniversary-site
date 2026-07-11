import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    projects: [
      {
        // 純粋関数（src/lib）と API Routes: Node 環境
        test: {
          name: "unit",
          environment: "node",
          include: ["src/lib/**/*.test.ts", "src/app/api/**/*.test.ts"],
        },
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "src"),
            "server-only": path.resolve(__dirname, "test/stubs/server-only.ts"),
          },
        },
      },
      {
        // UI コンポーネント: jsdom 環境
        plugins: [react()],
        test: {
          name: "ui",
          environment: "jsdom",
          include: ["src/components/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ts"],
        },
        resolve: {
          alias: { "@": path.resolve(__dirname, "src") },
        },
      },
    ],
  },
});
