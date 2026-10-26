/**
 * Stackra file contract:
 * Purpose: `LaunchDesktopOptions`, what `launchDesktop` takes: the canned answers of the bridges whose hardware a
 *          journey cannot reach.
 * Boundary: a type only. Keys are bridge keys (`peripherals.receipt.print`); main answers a faked bridge with its value
 *           as `data` instead of calling the driver.
 * Runtime: node
 * Governing contract: ADR 0251 (bridges); ADR 0269 (decision 6).
 */

/** The options of one desktop launch. */
export interface LaunchDesktopOptions {
  /** Bridge key → the `data` main answers it with. */
  readonly fakes?: Readonly<Record<string, unknown>>;
}
