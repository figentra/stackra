# @stackra/platform

Stackra platform: what the running target offers (ADR 0250). One `Platform` port answers `has(capability)` and hands
out one facet per capability (`network`, `notifications`, `scanner`, `fileHandling`, `shareTarget`, `badge`, `share`,
`haptics`, `install`); a call the target or device cannot honour resolves a typed refusal (`unavailable`,
`permission_denied`), never an exception. The package also owns remote push (`PlatformPushTransport`), the server-side captcha
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
| `.`           | `PlatformCapability`                                                                                                                                                                                                            | capability codes for `platform.has(...)`; `Required`/`Optional` levels      |
| `.`           | `DesktopConfig`, `PwaConfig`, `PushConfig` (+ `DesktopConfig$`, `PwaConfig$`, `PushConfig$`)                                                                                                                                    | the three configurations (`platform.desktop`, `.pwa`, `.push`)              |
| `.`           | `CachePreset`, `CacheStrategy`, `DesktopMode`, `FileLaunchType`, `InstallMoment`, `InstallPrompt`, `NotificationImportance`, `OverlayAnchor`, `OverlayStyle`, `PromptMoment`, `TrayClickAction`, `UpdateStrategy`, `WindowKind` | the configurations' vocabulary                                              |
| `.`           | `MemoryPlatformDriver`, `MemoryPushTransportDriver`, `MemoryCaptchaVerifierDriver`                                                                                                                                              | the `memory` candidates: tests, server renders, local runs                  |
| `./contracts` | `Platform`, `PlatformPushTransport`, `CaptchaVerifier` and their signature types                                                                                                                                                | the ports, injected by type (`Platform` from here only)                     |
| `./browser`   | `WebPlatformDriver`, `WebPushTransportDriver`                                                                                                                                                                                   | web and PWA                                                                 |
| `./desktop`   | `Bridge`, `PickFolderBridge`, `ElectronPlatformDriver`                                                                                                                                                                          | the bridge kind, the folder picker (main), the renderer driver              |
| `./contracts` | `KioskMode`, `SecondScreen`                                                                                                                                                                                                     | kiosk mode and the second-display window (the customer display)             |
| `.`           | `MemoryKioskModeDriver`, `MemorySecondScreenDriver`                                                                                                                                                                             | their `memory` candidates                                                   |
| `./desktop`   | `ElectronKioskModeDriver`, `ElectronSecondScreenDriver`, `SetKioskModeBridge`, `ShowSecondScreenBridge`                                                                                                                         | the main-process drivers and `platform.kiosk.set`, `platform.screen.second` |
| `./desktop`   | `browserWindowOptions`                                                                                                                                                                                                          | the `BrowserWindow` options of a configured window, the kiosk kind included |
| `./native`    | `ExpoPlatformDriver`, `ExpoPushTransportDriver`, `SelfHostedPushTransportDriver`                                                                                                                                                | the phone platform; push on a device (`platform.push.provider`)             |
| `./native`    | `ExpoAppLockDriver`, `AppLockGate`                                                                                                                                                                                              | the opt-in app lock on a phone                                              |
| `.`           | `AppLockConfig` (+ `AppLockConfig$`), `MemoryAppLockDriver`, `appLockPolicy`                                                                                                                                                    | the app lock configuration, memory driver and per-role merge                |
| `./contracts` | `AppLock`                                                                                                                                                                                                                       | the device check behind the app lock                                        |
| `./worker`    | `TurnstileCaptchaVerifierDriver`                                                                                                                                                                                                | Turnstile siteverify from a Cloudflare Worker                               |
| `./node`      | `TurnstileCaptchaVerifierDriver`                                                                                                                                                                                                | the same verifier for a Node service (Encore)                               |
| `./sw`        | `handleBackgroundSync`, `handlePush`, `handlePushSubscriptionChange`, `handleNotificationClick`, `handleShareTarget`, `handleSkipWaiting`                                                                                       | registered by the generated `sw.ts`                                         |
| `./react`     | `usePlatform`, `useCapability`, `useLaunchedFiles`, `usePushPermission`, `ScannerView`                                                                                                                                          | hooks and the scanner's camera view                                         |
| `./testing`   | `fakePlatform`                                                                                                                                                                                                                  | a fresh memory platform for one test                                        |

## Using it

```ts
import { PlatformCapability } from "@stackra/platform";
import { useCapability, usePlatform } from "@stackra/platform/react";
import { useSignal } from "@stackra/state/react";

const platform = usePlatform();
const isOnline = useSignal(platform.network.isOnline);

const granted = await platform.notifications.requestPermission();
if (!granted.ok) toast.warning(t(I18n.console.capabilities[granted.error.code]));

const scanner = useCapability("scanner", { required: true }); // the route declared `scanner: PlatformCapability.Required`
if (!scanner.isAvailable) return { kind: "unavailable" };
```

`has` answers whether the target offers a capability at all; a facet's own state (`scanner.isAvailable`,
`notifications.permission`) answers whether this device can use it now.

A bridge is the only path from the Electron renderer to main:

```ts
import { Bridge } from "@stackra/platform/desktop";

export class ExportCsvBridge extends Bridge({ key: "exports.save_csv", capability: PlatformCapability.FilesSave }) {
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

- A window of kind `kiosk` (`DesktopConfig.windows[].kind`, `WindowKind.Kiosk`) is full-display, frameless and cannot be
  resized, moved, minimised or closed; `browserWindowOptions(desktop.windows.main)` from `./desktop` gives the
  `BrowserWindow` options of any configured window, which the shell spreads under its own `webPreferences`. It locks
  that one window; `KioskMode` locks the whole app (ADR 0449 decision 5).

## Follow the system (STA-1536)

A native app follows what the phone's own settings decide and offers no in-app override of them (owner decision
2026-10-29). `SystemSettings` (`./contracts`) reads them; the person changes them in the OS settings.

```ts
const settings = useContainer().get(SystemSettings);
const tracking = await settings.tracking(); // App Tracking Transparency; null off iOS
ledger.setAppTrackingDenied(tracking !== null && tracking !== "granted"); // no marketing without ATT
const saving = useSignal(settings.lowPowerMode) || useSignal(settings.expensiveNetwork); // defer prefetch and media
if ((await settings.backgroundRefresh()) === "denied")
  showRefreshHint(() => settings.openSettings());
```

- `ExpoSystemSettingsDriver` (`./native`) is concrete: it imports expo-tracking-transparency, expo-battery and
  expo-background-task (and NetInfo) itself. They are optional peers, so the app adds them to its own dependencies (an
  Expo module links only from the app). A test subclass replaces `modules` with fakes; a `null` module reads as absent,
  so tracking on iOS reads `denied`.
- `MemorySystemSettingsDriver` (`.`) is the web, desktop and test driver: no controls (`null`), nothing saving.
- `createNotificationChannels(push.androidChannels, translate)` (`./native`) creates one Android channel per
  notification category, named in the phone's language; the push context calls it at launch, before the permission
  prompt, and again when the language changes. A push names its channel with `OutboundPush.channelId`.

### Device permissions

`DevicePermissions` (`./contracts`) is the one permission helper for camera, location, photos, Bluetooth and
microphone: `status` reads without prompting, `request` asks and resolves `granted`, `denied` or `blocked` (the OS will
not ask again), and `openSettings` opens the app's page in the OS settings. The app explains why before it asks, from
`assets/lang/<locale>/platform.json` (seven locales):

```ts
const permissions = useContainer().get(DevicePermissions);
explain(t("platform::permissions.bluetooth.why"));
if ((await permissions.request("bluetooth")) === "blocked")
  offer(
    t("platform::permissions.bluetooth.blocked"),
    t("platform::permissions.open_settings"),
    () => permissions.openSettings(),
  );
```

- `ExpoDevicePermissionsDriver` (`./native`) is concrete like the settings driver: it imports expo-camera's `Camera`,
  expo-location and expo-media-library itself. They are optional peers, so the app adds them to its own dependencies
  and declares their config plugins with the permission strings in `app.json`. A test subclass replaces `modules` with
  fakes; a `null` module reads `denied`.
  Bluetooth asks through React Native's `PermissionsAndroid` on Android 12 and later; elsewhere it reads `granted`, since
  iOS asks on first use and older Android grants it at install.
- `MemoryDevicePermissionsDriver` (`.`) is the web, desktop and test driver: every permission starts `prompt`.

### App lock (STA-1537)

An opt-in lock (off by default): biometrics on launch and after `lockAfter` in the background, the device passcode as
the fallback, and the app covered in the app switcher whenever it leaves the foreground.

```tsx
export class AppLockConfig extends BaseAppLockConfig {
  override isEnabled = true;
  override roles = { manager: { lockAfter: Duration.minutes(1) } }; // per role, over the app-wide values
}

<AppLockGate
  roleName={session.role}
  reason={t("platform::app_lock.reason")}
  unlockLabel={t("platform::app_lock.unlock")}
  coverColor={background}
  textColor={foreground}
>
  <Navigation />
</AppLockGate>;
```

- `AppLock` (`./contracts`) asks the phone; `ExpoAppLockDriver` (`./native`) is concrete over expo-local-authentication
  (an optional peer: the app adds it and its config plugin, which writes the Face ID usage text);
  `MemoryAppLockDriver` (`.`) serves tests, the web and the desktop.
- `AppLockGate` (`./native`) reads `AppLockConfig` (`platform.app_lock`) and `AppLock` from the container;
  `appLockPolicy(config, role)` (`.`) is the merge it uses. A phone with no biometric and no passcode is never locked.
- The cover is a React view drawn when the app turns inactive; iOS snapshots after it. Android may snapshot first; a
  hard guarantee there needs `FLAG_SECURE`, which also blocks screenshots, so it is not set.

### Live Activities

`LiveActivities` (`./contracts`) puts an order or booking in progress on the iPhone Lock Screen and in the Dynamic
Island (STA-1539). The product calls it as the order moves; every string arrives translated:

```ts
const activities = useContainer().get(LiveActivities);
await activities.show({
  reference: order.id,
  title: t("orders::live.title", order),
  status: t(`orders::status.${order.status}`),
  step: 2,
  steps: 4,
  url: `app://orders/${order.id}`,
});
await activities.end(order.id, { ...final, step: 4 }); // stays for `platform.liveActivity.endedDismissal` (15 minutes)
```

- `ExpoLiveActivitiesDriver` (`./native`) renders the one `OrderProgress` layout with expo-widgets and Expo UI's SwiftUI
  views (ADR 0478 decision 9: Expo's widget library, no hand-written Swift). Android, Expo Go, iOS before 16.2 and a
  phone with Live Activities switched off resolve `unavailable`. The app needs expo-widgets' config plugin.
- `MemoryLiveActivitiesDriver` (`.`) is the web, desktop and test driver; `isAvailable = false` makes it refuse.
- `LiveActivityConfig` (`.`, key `platform.liveActivity`) holds `endedDismissal`.
- Not yet: home-screen widgets, remote (push) updates and push-to-start, App Shortcuts and Siri intents.

## Testing

```ts
import { fakePlatform } from "@stackra/platform/testing";

const platform = fakePlatform({ scanner: { isAvailable: true, permission: "granted" } });
renderRoute(Routes.scan, { platform });
await act(() => platform.scanner.emit("6281000000012"));
```

Governing ADRs: 0250 (this package), 0251 (bridges and hardening), 0255 (PWA and push), 0281 (desktop surfaces), 0254,
0252, 0256, 0294 (decisions 15 to 17, 20, 26), 0269, 0127 2026-10-24 note.
