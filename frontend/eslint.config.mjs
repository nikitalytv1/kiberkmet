import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import babelParser from "@babel/eslint-parser";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-react"]
        }
      },
      globals: {
        ...globals.browser,
        ...globals.jest
      }
    },
    plugins: {
      react
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "no-unused-vars": "warn"
    }
  }
];