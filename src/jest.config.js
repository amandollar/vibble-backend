export default {
  testEnvironment: "node",
  testMatch: ["**/test/**/*.test.js"],
  transform: {},
  extensionsToTreatAsEsm: [".js"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
