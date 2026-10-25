/**
 * Stackra file contract:
 * Purpose: the `SettingFloorSource` port: the legal floors in force on a settings group at a target, read from the
 *          market pack of the target's market. The memory driver serves tests; the OS settings service implements it
 *          over its tenants' market pins with `settingFloorsOf`.
 * Boundary: an abstract class that is its own token, keyed `settings.SettingFloorSource`. It answers floors only;
 *           `SettingsResolver` refuses a write that crosses one and lifts a stored value that does. Which market a
 *           target is in, and the date, are the driver's to know.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 6); ADR 0363 (decision 4); ADR 0213 (decision 2); config-model section 3.
 */
import { Port } from "@stackra/contracts";

import type { SettingFloor } from "#contracts/types/setting-floor.type";
import type { SettingTarget } from "#contracts/types/setting-target.type";

/**
 * Answers the floors on a group.
 *
 * @example
 * export class MemorySettingFloorSourceDriver extends Driver(SettingFloorSource) {
 *   async floors(group: string): Promise<readonly SettingFloor[]> { ... }
 * }
 */
export abstract class SettingFloorSource extends Port {
  /** Type-only port key, so `DriverName<SettingFloorSource>` narrows to this port's drivers. */
  declare readonly "~key": "settings.SettingFloorSource";

  /** The floors in force today on `group` at `target`; none when its market sets none. */
  abstract floors(group: string, target: SettingTarget): Promise<readonly SettingFloor[]>;
}
