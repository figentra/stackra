# Plan: `@stackra/platform` wave 3

**Spec**: `.agents/specs/sta-348-platform/spec.md`

## Design

- `./contracts`: `Platform extends Port` with `has(capability: string)` and one facet per capability (types in
  `contracts/types/`), `PushTransport` (permission, request, settings, register) and `CaptchaVerifier` (verify). A
  refusal is `CapabilityResult` data built by the internal `refuse()`.
- `.`: `Capability` (codes plus the `Required`/`Optional` levels) and the vocabulary enums; `DesktopConfig`,
  `PwaConfig`, `PushConfig` over `DesktopOptions`, `PwaOptions`, `PushOptions`, each registering its shipped zod
  schema (`X$`) as `@stackra/state` does; `PushConfig.provider` is `DriverName<PushTransport>` through a
  `DriverRegistry` augmentation. Memory drivers for the three ports; `MemoryPlatformDriver.configure(options)` backs
  `fakePlatform`.
- Facets with live values use `@stackra/state` signals (`network.isOnline`, `fileHandling.launched`,
  `install.canPrompt`). The scanner's `View` is the driver's component, so `./react`'s `ScannerView` is neutral.
- `./browser`: `WebPlatformDriver` detects each API when asked; `WebScannerView` decodes with `BarcodeDetector`;
  `WebPushTransportDriver` subscribes with the VAPID key from `PushConfig`. The share inbox is IndexedDB
  (`stackra_platform`/`share_inbox`), shared by the worker (write) and the page (read once).
- `./electron`: `Bridge` via `createKind("bridge")` (called only, `{ key, capability }`); `PickFolderBridge` loads
  Electron inside `handle`; `ElectronPlatformDriver extends WebPlatformDriver` adding desktop capabilities under the
  preload's `window.stackra`.
- `./native`: two `PushTransport` drivers over expo-notifications sharing two permission functions.
- `./worker`: `TurnstileCaptchaVerifierDriver(SecretStore)` posts to siteverify with a timeout.
- `./sw`: six handlers typed by structural event types, so the worker program checks them against the WebWorker lib.

## Constitution check

- Boundaries: runtime imports workspace packages and optional peers only; `./contracts` is a leaf; other entries import
  `.`/`./contracts` through aliases (`./electron` reuses the browser driver for the Chromium renderer).
- Versions: catalogs and `workspace:*` only; two uncatalogued names reported (expo-notifications, fake-indexeddb).
- Naming: v3.1; files `<name>.<kind>.ts`; enum codes snake_case (tool-owned values keep their spelling); no parameter
  properties, no `#private` fields.
