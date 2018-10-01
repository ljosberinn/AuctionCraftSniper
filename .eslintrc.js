module.exports = {
  extends: "airbnb-base",
  env: {
    browser: true,
    es6: true,
    node: true,
    jquery: false
  },
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 6
  },
  parser: "typescript-eslint-parser",
  plugins: ["typescript"],
  rules: {
    "no-this-before-super": "warn",
    "no-undef": "warn",
    "no-unreachable": "warn",
    "no-unused-vars": "warn",
    "constructor-super": "warn",
    "valid-typeof": "warn",
    "arrow-parens": [2, "as-needed"],
    "max-len": ["warn", 150]
  },
  globals: {}
};