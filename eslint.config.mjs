import js from "@eslint/js";
import next from "@next/eslint-plugin-next";
import react from "eslint-plugin-react";

export default [
  {
    ignores: [".next/**", "node_modules/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
        globals: {
          crypto: "readonly",
          window: "readonly",
          process: "readonly",
        },
    },
    plugins: { react, "@next/next": next },
    rules: {
      ...next.configs.recommended.rules,
      "react/jsx-uses-vars": "error",
      "react/react-in-jsx-scope": "off",
    },
  },
  {
    files: ["tailwind.config.js"],
    languageOptions: {
      globals: { module: "readonly" },
    },
  },
];
