import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [reactHooks.configs["recommended-latest"], reactRefresh.configs.vite, tseslint.configs.recommended],
  },
  globalIgnores([".next/**", "dist/**", "node_modules/**", "vite.config.ts"]),
]);
