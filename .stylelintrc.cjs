module.exports = {
  extends: [
    "stylelint-config-standard",
    "stylelint-config-tailwindcss"
  ],
  rules: {
    "at-rule-no-unknown": null,
  },
  ignoreFiles: [
    "dist/**/*",
    "node_modules/**/*"
  ]
};
