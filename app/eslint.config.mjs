import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Downgrade to warning: setState in effects is a legitimate pattern
      // when reading browser-only APIs (localStorage, sessionStorage) on mount
      // or resetting animation state before async work.
      "react-hooks/set-state-in-effect": "warn",
      // Downgrade img warning — external URLs can't use next/image without remote config
      "@next/next/no-img-element": "warn",
    },
  },
]);

export default eslintConfig;
