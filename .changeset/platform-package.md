---
"@stackra/platform": minor
---

Add `@stackra/platform`, the target capabilities of the programming model v3.1 (it absorbs `network` and `pwa`): the
`Platform` port in `./contracts` with `has(capability)` and one facet per capability (network, notifications, scanner,
file handling, share target, badge, share, haptics, install), where a call the target cannot honour resolves a typed
refusal; the `PushTransport` and `CaptchaVerifier` ports; `Capability` and the configuration vocabulary;
`DesktopConfig`, `PwaConfig` and `PushConfig` (keys `platform.desktop`, `platform.pwa`, `platform.push`) with their
shipped schemas; memory drivers for the three ports; `WebPlatformDriver` and `WebPushTransportDriver` in `./browser`;
the `Bridge` kind, `PickFolderBridge` and `ElectronPlatformDriver` in `./electron`; the Expo and self-hosted push
transports in `./native`; `TurnstileCaptchaVerifierDriver` in `./worker`; the six service-worker handlers in `./sw`;
`usePlatform`, `useCapability`, `useLaunchedFiles`, `usePushPermission` and `ScannerView` in `./react`; and
`fakePlatform` in `./testing`.
