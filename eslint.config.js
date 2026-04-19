import js from "@eslint/js";
import tsESlintPlugin from "@typescript-eslint/eslint-plugin";
import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";
import tailwindPlugin from "eslint-plugin-tailwindcss";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  {
    ignores: [".astro/**", "dist/**", "astro.config.mjs"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  ...tailwindPlugin.configs["flat/recommended"],
  {
    settings: {
      tailwindcss: {
        config: path.resolve(__dirname, "src/styles/global.css"),
      },
    },
  },
  {
    files: ["**/*.astro", "**/*.{ts,tsx}", "**/*.{js,jsx}"],
    plugins: {
      "@typescript-eslint": tsESlintPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
];
