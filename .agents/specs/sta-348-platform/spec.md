# Feature Specification: `@stackra/platform` wave 3, target capabilities

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/platform` (experience, wave 3) for real: the capability ports and their drivers, the desktop
bridge, push, the PWA configuration and the service worker's handlers (ADR 0250, 0251, 0255, 0281). Depends on
`@stackra/contracts`, `@stackra/state`, `@stackra/storage`, `@stackra/config`. Export `Platform` from one entry only.

## Impact

- **Apps touched**: none (the template's apps consume `.`, `./contracts`, `./react`, `./testing`, and its generated
  samples `./electron`, `./native`, `./worker`, `./sw`; STA-344)
- **Services touched**: none
- **Packages touched**: `packages/experience/platform` (new member)
- **Cross-service events**: none
- **Tenancy and data**: device-local values only (shared payloads, picked folder paths); push tokens are handed to the
  caller, never stored or logged here
- **Secrets**: `TURNSTILE_SECRET_KEY` is read by name from the `SecretStore` port by the Turnstile driver; no value in
  the repository
- **ADR needed**: no (ADR 0250, 0251 as amended by 0294, 0254, 0255, 0281; ADR 0294 decisions 15 to 17, 20, 26; ADR
  0127 2026-10-24 note; ADR 0266; ADR 0269)
- **New dependencies**: workspace `@stackra/container`, `@stackra/validation`, `@stackra/filesystem` beside the four
  named; `expo-notifications` (`catalog:mobile`, not yet in the catalog) and `fake-indexeddb` (`catalog:quality`, test
  only, not yet in the catalog); `electron`, `expo-constants`, `react-native` from existing catalogs as optional peers
- **Deploy modes**: same in all; isomorphic `.`/`./contracts`/`./react`, `./browser` browser only, `./electron` main
  and renderer, `./native` device only, `./worker` Cloudflare Worker, `./sw` service worker, `./testing` node only
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/experience/platform/README.md`, `packages/experience/platform/AGENTS.md`; ADR 0120, 0127, 0250, 0251, 0254, 0255, 0266, 0269, 0281, 0294 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R2 (every client reads online state, permissions and capabilities through it; a wrong refusal or a
  missed permission is user-visible; the bridge is a security boundary)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry A3: `Platform` is exported from `./contracts` only; A13: the `Bridge`
  kind lives here, in `./electron`; the 2026-10-24 0127 note allows `./browser`, `./electron`, `./native`, `./sw`,
  `./worker` and the `./electron/after-pack` tool hook; `network` and `pwa` are folded in

## User Scenarios & Testing

### User Story 1 - Read a capability and degrade without crashing (Priority: P1)

The console's settings hook calls `platform.notifications.requestPermission()` and, on a refusal, toasts
`I18n.console.capabilities[granted.error.code]`; it shows the switch only when `platform.has(Capability.LocalNotifications)`.
The offline banner reads `useSignal(usePlatform().network.isOnline)`.

**Independent Test**: `src/core/drivers/__tests__/memory-platform.driver.test.ts`,
`src/browser/drivers/__tests__/web-platform.driver.test.ts`, `src/react/platform/__tests__/use-platform.test.tsx`.

**Acceptance Scenarios**:

1. **Given** a target that does not offer a capability, **When** a facet call runs, **Then** it resolves
   `{ ok: false, error: { code: "unavailable", capability } }`.
2. **Given** a denied permission, **When** it is requested, **Then** the result is `permission_denied`, never a throw.
3. **Given** the browser goes offline, **Then** `network.isOnline` flips and `useSignal` re-renders.

### User Story 2 - Scan a barcode through the port (Priority: P1)

The mobile scan page calls `useCapability("scanner", { required: true })` and renders `<ScannerView>`; its test drives
`fakePlatform({ scanner: {...} }).scanner.emit(code)`.

**Independent Test**: `src/react/capability/__tests__/use-capability.test.tsx`,
`src/react/scanner-view/__tests__/scanner-view.test.tsx`, `src/browser/components/__tests__/web-scanner-view.test.tsx`.

**Acceptance Scenarios**:

1. **Given** a target offering the scanner on a device without a camera, **Then** the facet is returned with
   `isAvailable: false`.
2. **Given** a required capability the target does not offer, **Then** `useCapability` throws (gen should have refused).
3. **Given** a mounted `ScannerView`, **When** the driver decodes a code, **Then** the page's `onBarcode` receives it.

### User Story 3 - Configure desktop, PWA and push (Priority: P1)

The console overrides `DesktopConfig` and `PwaConfig`, the mobile app `PushConfig`, each `extends Base<Name>` with
`override` fields and nested objects spread from the base (`BaseDesktopConfig["tray"]`); gen extends the shipped `X$`.

**Independent Test**: `src/config/__tests__/*.config.test.ts`, `src/core/constants/__tests__/*-config-schema.constant.test.ts`.

**Acceptance Scenarios**:

1. **Given** each base, **Then** its key is `platform.desktop`, `platform.pwa` or `platform.push` and an override keeps
   it.
2. **Given** the template's three overrides, **Then** they build, validate and freeze.
3. **Given** `X$.shape.<field>.unwrap().default(...)`, **Then** a generated override compiles from the shipped schema.

### User Story 4 - Push on every client (Priority: P2)

`PushConfig.provider` picks `expo`, `self_hosted`, `web` or `memory`; `usePushPermission()` feeds the settings switch.

**Independent Test**: `src/native/drivers/__tests__/*.test.ts`, `src/browser/drivers/__tests__/web-push-transport.driver.test.ts`,
`src/react/push-permission/__tests__/use-push-permission.test.tsx`.

### User Story 5 - Desktop bridge and PWA worker (Priority: P2)

Main binds `PickFolderBridge` (`platform.files.pick_folder`) behind `FileSystem`; the renderer binds
`ElectronPlatformDriver`; the generated `sw.ts` registers the six `handle*` functions.

**Independent Test**: `src/electron/**/__tests__/*.test.ts`, `src/sw/functions/__tests__/*.test.ts`.

**Acceptance Scenarios**:

1. **Given** a renderer input with a purpose that is not snake_case, **Then** the bridge refuses before any dialog.
2. **Given** a share POST, **Then** the payload is kept on the device and the worker answers 303 to `<page>?shared=<id>`;
   `platform.shareTarget.take(id)` reads it once.
3. **Given** a notification whose route leaves the origin, **Then** the click opens `/`.

## Requirements

- **FR-001**: Entries `.`, `./contracts`, `./browser`, `./electron`, `./native`, `./react`, `./sw`, `./testing`,
  `./worker` only (ADR 0127 2026-10-24 note).
- **FR-002**: `.` exports the registry row: `CachePreset`, `CacheStrategy`, `Capability`, `DesktopConfig`,
  `DesktopMode`, `FileLaunchType`, `InstallMoment`, `InstallPrompt`, `NotificationImportance`, `OverlayAnchor`,
  `OverlayStyle`, `PromptMoment`, `PushConfig`, `PushConfig$`, `PwaConfig`, `TrayClickAction`, `UpdateStrategy`,
  `WindowKind`; plus `DesktopConfig$`, `PwaConfig$` and the three memory drivers. Not `Platform` (A3).
- **FR-003**: `./contracts` exports `CaptchaVerifier`, `Platform`, `PushTransport` and the types their signatures name;
  it imports no other entry.
- **FR-004**: `./react` exports `ScannerView`, `useCapability`, `useLaunchedFiles`, `usePlatform`, `usePushPermission`;
  `./testing` exports `fakePlatform`; `./sw` exports the six `handle*`; `./electron` exports `Bridge`,
  `PickFolderBridge`, `ElectronPlatformDriver`; `./native` the Expo and self-hosted push transports; `./worker`
  `TurnstileCaptchaVerifierDriver`; `./browser` the web platform and push drivers.
- **FR-005**: A capability call that cannot be honoured resolves a typed refusal (`unavailable`, `permission_denied`).
- **FR-006**: The bridge validates renderer input; no `./electron` module imports Electron at load time.
- **FR-007**: The service worker caches no shared payload as a response and follows only in-app routes.

## Success Criteria

- **SC-001**: Every symbol the template imports from `@stackra/platform`, `/contracts`, `/react`, `/testing`, `/sw`,
  `/electron`, `/native` and `/worker` exists with the shape the template uses, except the exceptions listed below.
- **SC-002**: A test beside every public symbol, plus the barrel tests, passes in the testing workflow.
- **SC-003**: Refusals, renderer input validation, the share inbox's read-once rule and the notification route check
  are tested.

## Template imports not satisfied here (by design)

- `import { Platform } from "@stackra/platform"` in `apps/mobile/src/__tests__/mobile.module.test.ts`: one symbol, one
  entry; it moves to `@stackra/platform/contracts` in STA-344, as the gen samples already import it.
- `@stackra/platform/electron/after-pack` (electron-builder's `afterPack`, setting the fuses of ADR 0251 d3): needs
  `@electron/fuses`, not in a catalog; lands with the desktop release work (ADR 0254).
- The Expo `Platform` driver (network, scanner through expo-network and expo-camera): needs uncatalogued modules; the
  mobile wiring sample binds only the push transports, and tests use `fakePlatform`.
- The push context (foreground rule, Android channel creation with translated names, device registration with retries)
  is the app runtime's; this package ships the configuration and the transports.
- The desktop overlay shells (`LauncherOverlay`, `PanelOverlay`, ADR 0281 d5) and the main-process tray, overlay and
  update managers: Electron main work in `@stackra/app/electron`, not imported by the template.
- The template's `Capability.Required` in a route's `capability` map is served by `Capability` itself (two requirement
  cases beside the capability codes); a separate requirement enum would need a template change.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
