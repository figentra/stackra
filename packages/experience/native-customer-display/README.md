<!-- Purpose: the README of @stackra/native-customer-display: what the Expo module, its `external` driver and its config plugin are, and how a till app uses them. Boundary: this package only; the decisions live in the ADRs it names. Runtime: docs. Governing contract: ADR 0478, ADR 0430, ADR 0339. -->

# @stackra/native-customer-display

The Expo module behind the `CustomerDisplay` port of `@stackra/peripherals` (ADR 0478): an Expo Modules API package
with the TypeScript driver in `src/`, the Swift in `ios/`, the Kotlin in `android/`, the config plugin in `plugin/` and
`expo-module.config.json`. It draws the till's customer display view (basket lines, total, message) on the display
plugged into the tablet: an Android `Presentation` on the connected display, or a window in the iPad's external-display
scene (ADR 0430 decision 1). The Swift and Kotlin moved here unchanged from the mobile app's
`src/native-sources/customer-display/` (STA-1533). A call no display can honour resolves the `window` refusal of
`CapabilityResult` (`unavailable`), never an exception. The mocks stay `MemoryCustomerDisplayDriver` and the `channel`
driver of `@stackra/peripherals`.

**Tier:** `tier:lib` (`packages/experience/native-customer-display`). Entry `.`, plus `app.plugin.js` for Expo CLI.
Depends on `@stackra/peripherals` (the port), `@stackra/platform`, `@stackra/contracts` and `@stackra/container`; `expo`
is a peer (the config plugin).

## What is here

| Symbol                          | Use                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| `ExternalCustomerDisplayDriver` | `CustomerDisplay` on the external display: `probe`, `show(view)` as JSON, and `clear` |

## Use

```ts
// generated native wiring
{ port: CustomerDisplay, selectedBy: "config:peripherals.customerDisplay", candidates: {
  external: () => import("@stackra/native-customer-display").then((m) => m.ExternalCustomerDisplayDriver),
} }
```

```jsonc
// app.json: the package's config plugin, and scene support so iOS connects the external-display scene
{
  "plugins": [
    ["expo-build-properties", { "ios": { "enableSceneSupport": true } }],
    "@stackra/native-customer-display",
  ],
}
```

The plugin changes nothing today: an Android `Presentation` needs no manifest entry, and the iPad's external-display
scene comes from the app's scene support. A later native key for the display lands in the plugin, never in the app.

## Status

Whether the current React Native line keeps the external-display scene on iOS is the spike STA-475. The Swift and
Kotlin are checked on the box and on real displays, never on a developer Mac.
