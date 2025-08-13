// eslint.config.mjs
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: [".next/", "node_modules/", "dist/", "build/"],
  },
  {
    ...js.configs.recommended,
  },
  {
    ...tseslint.configs.recommended[0], // grab the first config object from the array
  },
  {
    files: ["**/*.js", "**/*.ts", "**/*.tsx", ".github/scripts/**/*.js"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        __dirname: "readonly",
        React: "readonly",
        require: "readonly",
        module: "readonly",
        console: "readonly",
        process: "readonly",
      },
    },
    settings: {
      react: { version: "detect" },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      eqeqeq: "error",
    },
  },
];
