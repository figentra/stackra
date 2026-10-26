/**
 * Stackra file contract:
 * Purpose: `DeviceKind`, one kind of the device catalogue: its snake_case key (a `RegisteredDevice.kind`), whether it
 *          runs unattended (a kiosk, a lane, a gate: kiosk lock on launch and the accessible kiosk surface), whether
 *          it faces customers, whether it counts against the plan's device limit, whether it is a fiscal unit (a till
 *          the market's fiscal mandate registers), and the peripherals it drives.
 * Boundary: a type only; `deviceCatalogueOf` reads it from `device-catalogue` rows. The catalogue is data: Stackra
 *           ships base rows, a product seeds and edits its own (config-model), and nothing branches on a kind's name.
 * Runtime: isomorphic
 * Governing contract: ADR 0430 (decision 2); ADR 0361 (decision 7); OS 0017 (d1: the device limit, peripherals never
 *                     count); OS 0016 (d4: fiscal onboarding during pairing).
 */

/** One device kind. */
export interface DeviceKind {
  /** The kind's key (`self_checkout_lane`), snake_case. */
  readonly key: string;
  /** True for a device nobody staffs: it enters the kiosk lock on launch and shows the kiosk surface. */
  readonly unattended: boolean;
  /** True for a screen customers read or touch. */
  readonly customerFacing: boolean;
  /** True when a device of this kind counts against the plan's `devices` limit. */
  readonly counted: boolean;
  /** True when a device of this kind is a fiscal unit the market's pack registers during pairing. */
  readonly fiscalUnit: boolean;
  /** The peripherals it drives, by snake_case name (`scale`, `access_controller`, `customer_display`). */
  readonly peripherals: readonly string[];
}
