# @stackra/platform

Stackra platform: what the running target offers (ADR 0250). One `Platform` port answers `has(capability)` and hands
out one facet per capability (`network`, `notifications`, `scanner`, `fileHandling`, `shareTarget`, `badge`, `share`,
`haptics`, `install`); a call the target or device cannot honour resolves a typed refusal (`unavailable`,
`permission_denied`), never an exception. The package also owns remote push (`PushTransport`), the server-side captcha
check (`CaptchaVerifier`), the desktop, PWA and push configurations, the `Bridge` kind of the Electron main process and
the service-worker handlers. It absorbs the retired `network` and `pwa` packages.

**Tier:** `tier:lib` (`packages/experience/platform`). Entries `.`, `./contracts`, `./browser`, `./desktop`,
`./native`, `./node`, `./react`, `./sw`, `./testing` and `./worker` (ADR 0127 2026-10-24 and 2026-10-26 notes). Depends on `@stackra/contracts`,
`@stackra/container`, `@stackra/config`, `@stackra/validation`, `@stackra/state` (signals), `@stackra/storage`
(`OfflineStore`) and `@stackra/filesystem` (the folder picker's disk). React is a peer; Electron, the Expo modules and
React Native, NetInfo, expo-camera and expo-haptics are optional peers of `./desktop` and `./native`.

## What is here

| Entry         | Symbol                                                                                                                                                                                                                          | Use                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `.`           | `Capability`                                                                                                                                                                                                                    | capability codes for `platform.has(...)`; `Required`/`Optional` levels      |
| `.`           | `DesktopConfig`, `PwaConfig`, `PushConfig` (+ `DesktopConfig$`, `PwaConfig$`, `PushConfig$`)                                                                                                                                    | the three configurations (`platform.desktop`, `.pwa`, `.push`)              |
| `.`           | `CachePreset`, `CacheStrategy`, `DesktopMode`, `FileLaunchType`, `InstallMoment`, `InstallPrompt`, `NotificationImportance`, `OverlayAnchor`, `OverlayStyle`, `PromptMoment`, `TrayClickAction`, `UpdateStrategy`, `WindowKind` | the configurations' vocabulary                                              |
| `.`           | `MemoryPlatformDriver`, `MemoryPushTransportDriver`, `MemoryCaptchaVerifierDriver`                                                                                                                                              | the `memory` candidates: tests, server renders, local runs                  |
| `./contracts` | `Platform`, `PushTransport`, `CaptchaVerifier` and their signature types                                                                                                                                                        | the ports, injected by type (`Platform` from here only)                     |
| `./browser`   | `WebPlatformDriver`, `WebPushTransportDriver`                                                                                                                                                                                   | web and PWA                                                                 |
| `./desktop`   | `Bridge`, `PickFolderBridge`, `ElectronPlatformDriver`                                                                                                                                                                          | the bridge kind, the folder picker (main), the renderer driver              |
| `./contracts` | `KioskMode`, `SecondScreen`                                                                                                                                                                                                     | kiosk mode and the second-display window (the customer display)             |
| `.`           | `MemoryKioskModeDriver`, `MemorySecondScreenDriver`                                                                                                                                                                             | their `memory` candidates                                                   |
| `./desktop`   | `ElectronKioskModeDriver`, `ElectronSecondScreenDriver`, `SetKioskModeBridge`, `ShowSecondScreenBridge`                                                                                                                         | the main-process drivers and `platform.kiosk.set`, `platform.screen.second` |
| `./native`    | `ExpoPlatformDriver`, `ExpoPushTransportDriver`, `SelfHostedPushTransportDriver`                                                                                                                                                | the phone platform; push on a device (`platform.push.provider`)             |
| `./worker`    | `TurnstileCaptchaVerifierDriver`                                                                                                                                                                                                | Turnstile siteverify from a Cloudflare Worker                               |
| `./node`      | `TurnstileCaptchaVerifierDriver`                                                                                                                                                                                                | the same verifier for a Node service (Encore)                               |
| `./sw`        | `handleBackgroundSync`, `handlePush`, `handlePushSubscriptionChange`, `handleNotificationClick`, `handleShareTarget`, `handleSkipWaiting`                                                                                       | registered by the generated `sw.ts`                                         |
| `./react`     | `usePlatform`, `useCapability`, `useLaunchedFiles`, `usePushPermission`, `ScannerView`                                                                                                                                          | hooks and the scanner's camera view                                         |
| `./testing`   | `fakePlatform`                                                                                                                                                                                                                  | a fresh memory platform for one test                                        |

## Using it

```ts
import { Capability } from "@stackra/platform";
import { useCapability, usePlatform } from "@stackra/platform/react";
import { useSignal } from "@stackra/state/react";

const platform = usePlatform();
const isOnline = useSignal(platform.network.isOnline);

const granted = await platform.notifications.requestPermission();
if (!granted.ok) toast.warning(t(I18n.console.capabilities[granted.error.code]));

const scanner = useCapability("scanner", { required: true }); // the route declared `scanner: Capability.Required`
if (!scanner.isAvailable) return { kind: "unavailable" };
```

`has` answers whether the target offers a capability at all; a facet's own state (`scanner.isAvailable`,
`notifications.permission`) answers whether this device can use it now.

A bridge is the only path from the Electron renderer to main:

```ts
import { Bridge } from "@stackra/platform/desktop";

export class ExportCsvBridge extends Bridge({ key: "exports.save_csv", capability: Capability.FilesSave }) {
  constructor(files: FileSystem) { ... }
  async handle(input: ExportCsvInput): Promise<ExportCsvOutput> { ... } // validate the input: it comes from the renderer
}
```

The service worker talks to the pages with `{ type }` messages: `outbox_drain` and `push_subscription_changed` from the
worker, `skip_waiting` from a page; the outbox's Background Sync tag is `stackra_outbox`. The share target keeps the
payload in IndexedDB (`stackra_platform`, store `share_inbox`) and redirects to `<page>?shared=<id>`, which
`platform.shareTarget.take(id)` reads once.

## Kiosk mode and the second screen

```ts
// renderer, through the generated preload
await window.stackra.invoke("platform.kiosk.set", { active: true }); // kiosk window, no menu, shortcuts off
await window.stackra.invoke("platform.screen.second", { route: "/customer-display" }); // on the external display
await window.stackra.invoke("platform.screen.second", { route: null }); // close it
```

- `ElectronKioskModeDriver` locks every window, now and later, removes the application menu and every global shortcut
  (overlays included) and, in a packaged build, closes developer tools as they open; `exit` gives the windows and the
  menu back, and the shortcuts return with the next launch. `DesktopConfig.kioskOnLaunch` is the launch default; a
  tenant's kiosk setting switches it at run time.
- `ElectronSecondScreenDriver` opens a frameless, full-screen, hardened window with no preload on the first non-primary
  display, at a route of the main window's own origin. The customer display it shows is fed by `@stackra/peripherals`'
  `channel` driver.

## Testing

```ts
import { fakePlatform } from "@stackra/platform/testing";

const platform = fakePlatform({ scanner: { isAvailable: true, permission: "granted" } });
renderRoute(Routes.scan, { platform });
await act(() => platform.scanner.emit("6281000000012"));
```

Governing ADRs: 0250 (this package), 0251 (bridges and hardening), 0255 (PWA and push), 0281 (desktop surfaces), 0254,
0252, 0256, 0294 (decisions 15 to 17, 20, 26), 0269, 0127 2026-10-24 note.
