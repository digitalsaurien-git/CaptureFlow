const globals = require("globals");

module.exports = [
  {
    ignores: ["node_modules/**"]
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.browser,
        ...globals.node,
        CaptureFlowLogic: "readonly"
      }
    },
    rules: {
      "no-constant-binary-expression": "error",
      "no-redeclare": "error",
      "no-undef": "error",
      "no-unreachable": "error"
    }
  }
];
