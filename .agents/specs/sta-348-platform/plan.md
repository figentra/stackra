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

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                                                                                                                |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/experience/platform`; workspace imports: `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/filesystem`, `@stackra/state`, `@stackra/storage`, `@stackra/validation` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                                                                                                                                 |
| Security                              | PASS   | the bridge validates renderer input; the service worker caches no shared payload and follows only in-app routes                                                                                                                                                     |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                                                                                                                        |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                                                                                                                      |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                                                                                                              |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                                                                                                                    |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                                                                                                           |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only; the `expo-notifications` and `fake-indexeddb` pins are added by the owner (T016)                                                                                                                                                 |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                                                                                                     |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                                                                                                                  |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                                                                                                             |

- Boundaries: runtime imports workspace packages and optional peers only; `./contracts` is a leaf; other entries import
  `.`/`./contracts` through aliases (`./electron` reuses the browser driver for the Chromium renderer).
- Versions: catalogs and `workspace:*` only; two uncatalogued names reported (expo-notifications, fake-indexeddb).
- Naming: v3.1; files `<name>.<kind>.ts`; enum codes snake_case (tool-owned values keep their spelling); no parameter
  properties, no `#private` fields.

## Deploy modes

| Mode       | Behaviour                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| SaaS       | a build-time library, bundled into the consumer's app or service                                             |
| On-prem    | identical: the same build, no SaaS-only code path                                                            |
| Air-gapped | identical: the push and captcha drivers are configured by the consumer, and the package makes no call itself |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.`, `./contracts`, `./browser`, `./electron`, `./native`, `./react`, `./sw`, `./testing` and `./worker` — Validates: FR-001
- **P-002**: `.` exports the registry row (`CachePreset` to `WindowKind`) plus `DesktopConfig$`, `PwaConfig$` and the three memory drivers, and does not export `Platform` — Validates: FR-002
- **P-003**: `./contracts` exports `CaptchaVerifier`, `Platform`, `PushTransport` and the types their signatures name, and imports no other entry — Validates: FR-003
- **P-004**: each entry exports its named symbols: `./react` the five hooks and `ScannerView`, `./testing` `fakePlatform`, `./sw` the six `handle*` functions, `./electron` `Bridge`, `PickFolderBridge` and `ElectronPlatformDriver`, `./native` the push transports, `./worker` `TurnstileCaptchaVerifierDriver`, `./browser` the web platform and push drivers — Validates: FR-004
- **P-005**: a capability call that cannot be honoured resolves to a typed refusal (`unavailable` or `permission_denied`) instead of throwing — Validates: FR-005
- **P-006**: `Bridge` validates renderer input before it runs a handler, and no `./electron` module imports `electron` at load time — Validates: FR-006
- **P-007**: the service worker handlers cache no shared payload as a response and follow only in-app routes — Validates: FR-007
