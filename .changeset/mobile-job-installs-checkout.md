---
"@stackra/runway": patch
---

The mobile job installs the template checkout before the EAS build: with no `node_modules`, it copies the product's
`.npmrc` in and runs `pnpm install --ignore-workspace --no-frozen-lockfile --ignore-scripts` there, so EAS can load the
config plugins `app.json` names (Pay staging failed on `react-native-bottom-tabs`).
