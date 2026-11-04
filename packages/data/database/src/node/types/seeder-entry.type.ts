/**
 * Stackra file contract:
 * Purpose: `SeederEntry`, one seeder as a service's generated seed entry lists it: its locked key, module, profile and
 *          class.
 * Boundary: a type only; gen writes the list in module order.
 * Runtime: node
 * Governing contract: ADR 0190 (profiles); ADR 0294 (decision 20: `<module>.<profile>`); STA-1709.
 */
import type { AnyClass } from "@stackra/container";

import type { Seeder } from "#core/bases/seeder.base";

/** One seeder of a service. */
export interface SeederEntry {
  /** The seeder's key, `<module>.<profile>` (`orders.demo`). */
  readonly key: string;

  /** The module key. */
  readonly module: string;

  /** `minimal`, `demo` or `test`, the file name. */
  readonly profile: string;

  /** The seeder class. */
  readonly type: AnyClass<Seeder>;
}
