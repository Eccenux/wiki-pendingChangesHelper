module.exports = {
  "env": {
    "node": true,
    "browser": true
  },
  "globals": {
    "$": true,
    "mw": true,
    "pendingChangesHelperWrapper": true,
    "pendingChangesHelper": true,
    "UserConfig": true,
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 2019,
    "sourceType": "module"
  },
  "rules": {
    "no-prototype-builtins": "off",
  }
};