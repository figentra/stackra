---
"@stackra/gen": minor
---

Write an app's Expo config (`.stackra/app.config.ts` and the root `app.config.ts` shim) from `defineApp`, the config
classes, the lang and the brand kit's icon sets: identity, per-app languages and RTL, the passkey associated domain,
expo-widgets with its app group and Live Activities, the alternate icons, the native share and spotlight plugins and
the permission plugins. Refuses `expo_owned_key`, `expo_identity_missing`, `expo_permission_text_missing`,
`app_icon_drift`, `app_definition_not_static` and an authored `app.json` or `app.config.ts` (`shim_authored`).
