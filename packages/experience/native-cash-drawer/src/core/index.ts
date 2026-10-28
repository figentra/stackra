/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/native-cash-drawer: the `printer_kick`, Sunmi and PAX drivers
 *          behind `CashDrawer` (ADR 0478 decision 5), until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Loadable anywhere: no module here imports a native package; the
 *           drivers read the `StackraCashDrawer` module from the modules registry when they run. The vendor table, the
 *           module type and the shared functions stay internal. Certification pending (STA-739).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0478 (decisions 2 and 5); the STA-347 stand-in barrel decision.
 */
export { PaxCashDrawerDriver } from "#core/drivers/pax-cash-drawer.driver";
export { PrinterKickCashDrawerDriver } from "#core/drivers/printer-kick-cash-drawer.driver";
export { SunmiCashDrawerDriver } from "#core/drivers/sunmi-cash-drawer.driver";
