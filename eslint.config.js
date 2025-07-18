import { includeIgnoreFile } from "@eslint/compat"
import js from "@eslint/js"
import svelte from "eslint-plugin-svelte"
import globals from "globals"
import { fileURLToPath } from "node:url"
import ts from "typescript-eslint"
import svelteConfig from "./svelte.config.js"

const gitignorePath = fileURLToPath(new URL("./.gitignore", import.meta.url))

export default ts.config(
  includeIgnoreFile(gitignorePath),
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: [".svelte"],
        parser: ts.parser,
        svelteConfig,
      },
    },
  },
  {
    rules: {
      semi: ["warn", "never"],
      indent: ["warn", "tab"],
      "@typescript-eslint/no-unused-vars": "off",
      "svelte/valid-each-key": "off",
      // Add any formatting rules you care about
    },
  },
)
