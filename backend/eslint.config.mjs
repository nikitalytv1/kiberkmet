import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,  // Node.js okolje
        ...globals.jest   // Jest globals: test, expect, describe...
      }
    }
  }
];