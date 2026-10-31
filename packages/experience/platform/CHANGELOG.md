# @stackra/platform

## 0.2.0

### Minor Changes

- 6f67da8: Add `killSwitchServiceWorker()` to `@stackra/platform/sw`: the source of a self-retiring `sw.js` (ADR 0325 rule 18).
  Published at the installed worker's URL, it activates at once, deletes every cache, unregisters itself and reloads the
  open tabs (runbook: deploys, "Retire a service worker").

### Patch Changes

- 3d18ae6: Fix a launch crash on iOS: `ExpoSystemSettingsDriver.tracking()` called expo-tracking-transparency's status read,
  which is fatal (`RCTFatal`) in an app without `NSUserTrackingUsageDescription`. Tracking now reads `denied` without
  calling the library unless the host sets `asksForTracking` (a driver subclass, added with the plugin and its usage
  string); `requestTracking()` then never prompts.
- Updated dependencies [9085c41]
  - @stackra/contracts@0.2.0
  - @stackra/filesystem@0.2.0
  - @stackra/storage@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/validation@0.2.0
  - @stackra/state@0.2.0

## 0.1.0

### Minor Changes

- 9277eeb: Kiosks, lanes and gates (STA-801, ADR 0428 to 0430): `KioskSurface` and `useKiosk` (web and native) with idle reset,
  reach layout, high contrast and audio announcements; `KioskConfig` (`platform.kiosk`) and `enterKioskOnLaunch`;
  `Scale.onWeight` weight streams; the `AccessController` port with its `memory` driver, Ed25519 receipt tokens
  (`signReceiptToken`, `verifyReceiptToken`, `importReceiptPublicKey`) and `ExitGateService`; the `external` customer
  display driver over the native `StackraCustomerDisplay` module; `BASE_DEVICE_CATALOGUE` and `deviceCatalogueOf`.
  `Scale` gains an abstract `onWeight`: a custom `Scale` driver must implement it.
- 3a94a6e: Follow the phone's system-owned settings (STA-1536): the `SystemSettings` port with its memory driver and the abstract
  `ExpoSystemSettingsDriver` (App Tracking Transparency, Low Power Mode, an expensive connection, background refresh and
  the settings deep link), `createNotificationChannels` for one Android channel per category, `OutboundPush.channelId`,
  and `ConsentLedger.setAppTrackingDenied`, which refuses marketing on the client and in the signed snapshot.
- de4d77d: Add `AppIcon` (STA-1541): alternate home-screen icons per brand, season or tenant, switched with `useAppIcon()`. Ships
  the memory driver, `ExpoAppIconDriver` over expo-alternate-app-icons, `AppIconConfig` (`platform.app_icon`, the icon
  names the build carries) and the `app_icon` refusal code.
- 072dc7e: Add the opt-in app lock (STA-1537): the `AppLock` port, `AppLockConfig` (`platform.app_lock`, off by default, with the
  time in the background before it locks again, the passcode fallback and per-role overrides), `appLockPolicy`, the
  memory driver, `ExpoAppLockDriver` over expo-local-authentication, and `AppLockGate`, which prompts on launch and on
  return, and covers the app in the app switcher. Ships `platform::app_lock.*` in seven locales.
- b58ebce: Rename the `./electron` entry to `./desktop` (ADR 0345 decision 9): `Bridge`, `PickFolderBridge` and
  `ElectronPlatformDriver` keep their names, so only the import path changes (`@stackra/platform/desktop`). Add
  `ExpoPlatformDriver` to `./native`, the `Platform` driver of the Expo target: online state from NetInfo, local
  notifications and the badge from expo-notifications, the share sheet from React Native, haptics from expo-haptics and
  the barcode scanner from expo-camera; `has` answers false for file handling, share target and install. NetInfo,
  expo-camera and expo-haptics are new optional peers.
- 1723c05: Add `SystemPermissions` (STA-1536), the one permission helper for camera, location, photos, Bluetooth and microphone:
  it reads and asks, answers `granted`, `denied` or `blocked`, and opens the OS settings when blocked. Ships the memory
  driver, the abstract `ExpoSystemPermissionsDriver` and the `platform::permissions.*` explanations in seven locales.
- d15a219: `ExpoSystemPermissionsDriver` is concrete (STA-1536): it imports expo-camera, expo-location and expo-media-library
  itself, so an app binds it directly instead of subclassing it to hand the libraries over; a test subclass can still
  replace `modules`. expo-location and expo-media-library are new optional peers.
- 8ce76e9: `ExpoSystemSettingsDriver` is concrete (STA-1536): it imports expo-tracking-transparency, expo-battery and
  expo-background-task itself, so an app binds it directly instead of subclassing it to hand the libraries over; a test
  subclass can still replace `modules`. The three Expo libraries are new optional peers.
- c46f32f: Add the `KioskMode` and `SecondScreen` ports with memory and Electron main-process drivers, the
  `SetKioskModeBridge` (`platform.kiosk.set`) and `ShowSecondScreenBridge` (`platform.screen.second`),
  `DesktopConfig.kioskOnLaunch`, and the `Capability.CardTerminal` code.
- 2c2beca: `WindowKind.Kiosk`, and `browserWindowOptions` in `./desktop`, which maps a `DesktopConfig.windows` entry to Electron
  `BrowserWindow` options (a kiosk window is full-display, frameless and cannot be closed) (STA-925, ADR 0449).
- 9e63234: `LiveActivities` follow-ups (STA-1539): `ExpoLiveActivitiesDriver` keeps each running activity's id in storage, so an
  activity started before a relaunch is updated and ended rather than started twice; on Android the same calls post an
  ongoing notification through expo-notifications; `pushToken` and `onPushToStartToken` give the app the APNs tokens its
  server pushes to. `LiveActivityConfig` gains `androidChannelId`, `apnsBundleId` and `apnsEnvironment`.
- 04a0f8c: Add `LiveActivities` (STA-1539): an order or booking in progress on the iPhone Lock Screen and in the Dynamic Island,
  shown, updated and ended by the product. Ships the memory driver, `ExpoLiveActivitiesDriver` with the `OrderProgress`
  layout on expo-widgets and Expo UI (optional peers), and `LiveActivityConfig` for how long an ended activity stays.
- 544b42d: Add `LiveActivityPushes` (STA-1539), the server half of `LiveActivities`: start, update or end an activity remotely
  by pushing to the token the device handed over. Ships `MemoryLiveActivityPushesDriver` and
  `ApnsLiveActivityPushesDriver` (`./node`), an APNs `liveactivity` push over HTTP/2 signed with the `APNS_*` secrets.
- 2787c1e: Add `@stackra/platform`, the target capabilities of the programming model v3.1 (it absorbs `network` and `pwa`): the
  `Platform` port in `./contracts` with `has(capability)` and one facet per capability (network, notifications, scanner,
  file handling, share target, badge, share, haptics, install), where a call the target cannot honour resolves a typed
  refusal; the `PushTransport` and `CaptchaVerifier` ports; `Capability` and the configuration vocabulary;
  `DesktopConfig`, `PwaConfig` and `PushConfig` (keys `platform.desktop`, `platform.pwa`, `platform.push`) with their
  shipped schemas; memory drivers for the three ports; `WebPlatformDriver` and `WebPushTransportDriver` in `./browser`;
  the `Bridge` kind, `PickFolderBridge` and `ElectronPlatformDriver` in `./electron`; the Expo and self-hosted push
  transports in `./native`; `TurnstileCaptchaVerifierDriver` in `./worker`; the six service-worker handlers in `./sw`;
  `usePlatform`, `useCapability`, `useLaunchedFiles`, `usePushPermission` and `ScannerView` in `./react`; and
  `fakePlatform` in `./testing`.
- 90957bd: Breaking renames for unique public names (STA-1383): `@stackra/platform` `Capability` is `PlatformCapability` (iam's
  `Capability` is the permission capability), and the `@stackra/platform/contracts` port `PushTransport` (this device's
  push registration) is `PlatformPushTransport`, keyed `platform.PlatformPushTransport` (notifications' `PushTransport`
  is the server send). Drivers keep their names; importers in peripherals and navigation are updated.
- 6855121: Add the `./node` entry: `TurnstileCaptchaVerifierDriver`, the same class `./worker` exports, so a Node service (OS
  security-center, OS-366) binds the Turnstile `CaptchaVerifier` driver without importing the Worker entry. `./worker` is
  unchanged.
- d7ed271: Add `HomeWidgets` (STA-1539): the app publishes a glance (title, value, caption) that its `Glance` home-screen and
  Lock Screen widget shows from the shared app group; `ExpoHomeWidgetsDriver` writes it through expo-widgets, and
  `MemoryHomeWidgetsDriver` serves tests and the web. Add `AppShortcuts` for App Shortcuts and Siri intents (runs and
  donations) with `MemoryAppShortcutsDriver`; its Expo driver follows once expo-app-intents is catalogued.

### Patch Changes

- ae3d280: Add the `@stackra/config/contracts` entry and move the `SecretStore` port into it (one symbol, one entry): import it from
  `@stackra/config/contracts`; `@stackra/config` no longer exports it. Dependants import from the new entry.
- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- cc96d5d: `AppLockConfig$` reads a role override's `isEnabled` and `lockAfter` as exact optionals, so `AppLockOptions.roles`
  type-checks under `exactOptionalPropertyTypes` (STA-1537). The Live Activity messages name the config key
  `platform.live_activity` (STA-1539).
- d63f012: `appLockPolicy` takes the built `AppLockConfig` the container holds instead of `AppLockOptions`, so `AppLockGate`
  passes its configuration straight through.
- 1b4effa: `@stackra/platform`'s permission port is named `SystemPermissions` (key `platform.SystemPermissions`), beside
  `SystemAccessibility` and `SystemSettings`, so it no longer shares a name with `@stackra/devices`' `DevicePermissions`.
  Its drivers are `MemorySystemPermissionsDriver` and `ExpoSystemPermissionsDriver`; the card terminal and scale drivers
  take it as their permission parameter, and gen's host wiring defaults its `SystemPermissions` table.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [d156aa8]
- Updated dependencies [6dd5245]
- Updated dependencies [a289662]
- Updated dependencies [d72a734]
- Updated dependencies [2787c1e]
- Updated dependencies [20f3fe9]
- Updated dependencies [6919ebd]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [e01195a]
- Updated dependencies [2787c1e]
- Updated dependencies [950bb8b]
- Updated dependencies [8992b7a]
- Updated dependencies [d156aa8]
- Updated dependencies [2787c1e]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/filesystem@0.1.0
  - @stackra/state@0.1.0
  - @stackra/storage@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
