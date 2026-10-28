<!-- Purpose: the README of @stackra/native-scale: what the Expo module, its two protocol drivers and its config plugin are, which scales they cover and why, and how a host uses them. Boundary: this package only; the decisions live in the ADRs it names. Runtime: docs. Governing contract: ADR 0478, ADR 0253, ADR 0339, ADR 0449. -->

# @stackra/native-scale

The Expo module behind the `Scale` port of `@stackra/peripherals` (ADR 0478): an Expo Modules API package with the
TypeScript drivers in `src/`, the Swift in `ios/`, the Kotlin in `android/`, the config plugin in `plugin/` and
`expo-module.config.json`. One driver per scale protocol; the port and its `ScaleReading` are unchanged. A call no scale
can honour resolves the `serial` refusal of `CapabilityResult` (`unavailable`, `permission_denied`), never an exception.
The mock stays `MemoryScaleDriver` of `@stackra/peripherals`; a legal-for-trade reading (stable flag, unit, tare) only
ever comes from a driver reading a real scale line.

**Tier:** `tier:lib` (`packages/experience/native-scale`). Entry `.`, plus `app.plugin.js` for Expo CLI. Depends on
`@stackra/peripherals` (the port), `@stackra/platform`, `@stackra/contracts`, `@stackra/container`, `@stackra/config`,
`@stackra/validation` and zod; `expo` is a peer (the config plugin).

## The first scale protocols, and why

Scale makers and protocols are pack data: `SCALE_PROTOCOLS`, the default of `NativeScaleConfig.protocols`. The first two:

| Protocol           | Driver                       | Makers and models                                                                                                   | What it gives a till                                                                    |
| ------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `mt_sics`          | `MtSicsScaleDriver`          | Mettler Toledo balances and weighing terminals with MT-SICS (IND, ICS, XS, MS, ML series)                           | request and answer: settled or moving net weight with its unit, tare (`TA`), over/under |
| `continuous_ascii` | `ContinuousAsciiScaleDriver` | A&D balances and indicators in the A&D standard format (EK-i, EW-i, GF, GX, FX-i, AD-4212), and A&D-compatible ones | a continuous stream: `ST`/`US`/`OL` header, gross or net, signed value and unit         |

Why these two: MT-SICS is the one fully public vendor command set from the largest retail and precision scale maker,
and it answers every field a legal-for-trade record needs (stability, unit, net weight, tare, overload). The A&D
standard format is the most copied continuous serial output among indicator makers, so one stream driver covers a wide
set of counter and precision scales (jewellery and buy-back weighing for Mezzora, weighed goods for Jute) without a
vendor SDK. Both are plain ASCII lines, so the native side is a byte pipe and every parse stays in tested TypeScript.
Next candidates, each a driver plus a pack entry: Toledo 8217 (scanner-scales, the `ScannerScale` port), CAS and DIGI.

## Transports

| Transport | iOS                                 | Android                                                            | Address                                    |
| --------- | ----------------------------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| `ble`     | CoreBluetooth, a BLE serial bridge  | GATT, a BLE serial bridge                                          | peripheral identifier (iOS), MAC (Android) |
| `spp`     | refused (no SPP without MFi)        | Bluetooth Classic RFCOMM on the SPP UUID, scale paired in settings | MAC                                        |
| `usb`     | refused (no USB serial without MFi) | usb-serial-for-android: FTDI, CP210x, CH34x, PL2303, CDC-ACM       | `<vendorId>:<productId>` in hex, or `any`  |

The BLE service and characteristics default to the Nordic UART service most BLE serial bridges expose
(`bleService`, `bleNotify`, `bleWrite`).

**Third-party licence.** The `usb` link uses `com.github.mik3y:usb-serial-for-android` 3.8.1 (MIT), fetched from JitPack
at build time and declared only in `android/build.gradle` (ADR 0478 decision 4). The owner approved it for the licence
allow-list of ADR 0174 decision 3 on 2026-10-29; a version bump keeps the approval while the licence stays MIT.

## What is here

| Symbol                                                                     | Use                                                                                                            |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `MtSicsScaleDriver`                                                        | `Scale` over MT-SICS: `read` sends `SI`, `onWeight` runs `SIR` and stops with `@`                              |
| `ContinuousAsciiScaleDriver`                                               | `Scale` over the A&D stream: `read` takes the next line (after `request`, when one is set)                     |
| `frame()` on both drivers                                                  | the full `ScaleFrame`: grams, value and unit as displayed, stable, net or gross, tare                          |
| `NativeScaleConfig` (+ `NativeScaleOptions`, `NATIVE_SCALE_CONFIG_SCHEMA`) | the configuration (key `native_scale`): protocol, transport, address, baud rate, BLE UUIDs, read timeout, pack |
| `SCALE_PROTOCOLS`                                                          | the shipped protocol pack                                                                                      |
| `ScaleFrame`, `ScaleProtocol`, `ScaleProtocolName`, `ScaleTransport`       | the types a caller names                                                                                       |

## Use

```ts
// src/config/native-scale.config.ts of a till app
import { NativeScaleConfig as BaseNativeScaleConfig } from "@stackra/native-scale";
import type { ScaleProtocolName, ScaleTransport } from "@stackra/native-scale";

export class NativeScaleConfig extends BaseNativeScaleConfig {
  override protocol: ScaleProtocolName = "continuous_ascii";
  override transport: ScaleTransport = "usb";
}
// runway sets native_scale.address per device, e.g. "0403:6001".

// generated native wiring
{ port: Scale, selectedBy: "config:native_scale.protocol", candidates: {
  mt_sics: () => import("@stackra/native-scale").then((m) => m.MtSicsScaleDriver),
  continuous_ascii: () => import("@stackra/native-scale").then((m) => m.ContinuousAsciiScaleDriver),
} }
```

```jsonc
// app config: keep only the transports the runway lists
{ "plugins": [["@stackra/native-scale", { "transports": ["ble", "usb"] }]] }
```

The plugin sets `NSBluetoothAlwaysUsageDescription` (iOS) for `ble`; adds the Bluetooth permissions and the optional
`bluetooth_le` and `usb.host` features (Android); and writes `stackraNativeScaleUsb=false` into `gradle.properties` when
`usb` is not kept, which drops the USB serial library and its Kotlin from the build.

## Status

Not certified: the parsers and drivers are built from the vendors' public manuals and tested against a stand-in module
replaying transcribed lines. The Swift and Kotlin are checked on the box and on certified models (STA-739), never on a
developer Mac. The app asks for the Bluetooth runtime permission itself; the module only reports `E_PERMISSION`.
