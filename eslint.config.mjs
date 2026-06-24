import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import nextPlugin from "@next/eslint-plugin-next";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      react: reactPlugin,
      "@next/next": nextPlugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-empty": ["error", { allowEmptyCatch: true }],
      "prefer-const": "warn",
      "no-var": "error",
      eqeqeq: ["error", "always"],
      "no-duplicate-imports": "error",
      "no-unused-expressions": "warn",
      "prefer-template": "warn",
      "react/self-closing-comp": "error",
      "react/jsx-curly-brace-presence": ["error", { props: "never", children: "never" }],
      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "error",
    },
  },
  {
    ignores: ["node_modules/", ".next/", "dist/", "coverage/", "*.config.*", "next-env.d.ts"],
  }
);
