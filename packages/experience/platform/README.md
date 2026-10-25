# @stackra/platform

Stackra platform: what the running target offers (ADR 0250). One `Platform` port answers `has(capability)` and hands
out one facet per capability (`network`, `notifications`, `scanner`, `fileHandling`, `shareTarget`, `badge`, `share`,
`haptics`, `install`); a call the target or device cannot honour resolves a typed refusal (`unavailable`,
`permission_denied`), never an exception. The package also owns remote push (`PushTransport`), the server-side captcha
check (`CaptchaVerifier`), the desktop, PWA and push configurations, the `Bridge` kind of the Electron main process and
the service-worker handlers. It absorbs the retired `network` and `pwa` packages.

**Tier:** `tier:lib` (`packages/experience/platform`). Entries `.`, `./contracts`, `./browser`, `./desktop`,
`./native`, `./react`, `./sw`, `./testing` and `./worker` (ADR 0127 2026-10-24 note). Depends on `@stackra/contracts`,
`@stackra/container`, `@stackra/config`, `@stackra/validation`, `@stackra/state` (signals), `@stackra/storage`
(`OfflineStore`) and `@stackra/filesystem` (the folder picker's disk). React is a peer; Electron, the Expo modules and
React Native, NetInfo, expo-camera and expo-haptics are optional peers of `./desktop` and `./native`.

## What is here

| Entry         | Symbol                                                                                                                                                                                                                          | Use                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `.`           | `Capability`                                                                                                                                                                                                                    | capability codes for `platform.has(...)`; `Required`/`Optional` levels |
| `.`           | `DesktopConfig`, `PwaConfig`, `PushConfig` (+ `DesktopConfig$`, `PwaConfig$`, `PushConfig$`)                                                                                                                                    | the three configurations (`platform.desktop`, `.pwa`, `.push`)         |
| `.`           | `CachePreset`, `CacheStrategy`, `DesktopMode`, `FileLaunchType`, `InstallMoment`, `InstallPrompt`, `NotificationImportance`, `OverlayAnchor`, `OverlayStyle`, `PromptMoment`, `TrayClickAction`, `UpdateStrategy`, `WindowKind` | the configurations' vocabulary                                         |
| `.`           | `MemoryPlatformDriver`, `MemoryPushTransportDriver`, `MemoryCaptchaVerifierDriver`                                                                                                                                              | the `memory` candidates: tests, server renders, local runs             |
| `./contracts` | `Platform`, `PushTransport`, `CaptchaVerifier` and their signature types                                                                                                                                                        | the ports, injected by type (`Platform` from here only)                |
| `./browser`   | `WebPlatformDriver`, `WebPushTransportDriver`                                                                                                                                                                                   | web and PWA                                                            |
| `./desktop`   | `Bridge`, `PickFolderBridge`, `ElectronPlatformDriver`                                                                                                                                                                          | the bridge kind, the folder picker (main), the renderer driver         |
| `./native`    | `ExpoPlatformDriver`, `ExpoPushTransportDriver`, `SelfHostedPushTransportDriver`                                                                                                                                                | the phone platform; push on a device (`platform.push.provider`)        |
| `./worker`    | `TurnstileCaptchaVerifierDriver`                                                                                                                                                                                                | Turnstile siteverify from a Cloudflare Worker                          |
| `./sw`        | `handleBackgroundSync`, `handlePush`, `handlePushSubscriptionChange`, `handleNotificationClick`, `handleShareTarget`, `handleSkipWaiting`                                                                                       | registered by the generated `sw.ts`                                    |
| `./react`     | `usePlatform`, `useCapability`, `useLaunchedFiles`, `usePushPermission`, `ScannerView`                                                                                                                                          | hooks and the scanner's camera view                                    |
| `./testing`   | `fakePlatform`                                                                                                                                                                                                                  | a fresh memory platform for one test                                   |

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

## Testing

```ts
import { fakePlatform } from "@stackra/platform/testing";

const platform = fakePlatform({ scanner: { isAvailable: true, permission: "granted" } });
renderRoute(Routes.scan, { platform });
await act(() => platform.scanner.emit("6281000000012"));
```

Governing ADRs: 0250 (this package), 0251 (bridges and hardening), 0255 (PWA and push), 0281 (desktop surfaces), 0254,
0252, 0256, 0294 (decisions 15 to 17, 20, 26), 0269, 0127 2026-10-24 note.
