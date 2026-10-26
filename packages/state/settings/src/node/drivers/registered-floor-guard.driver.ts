/**
 * Stackra file contract:
 * Purpose: `RegisteredFloorGuardDriver`, the `SettingFloorSource` of a settings run outside a booted service (the
 *          `stackra settings:apply` runner): it answers no floor for a registered group none of whose keys declares a
 *          legal floor, and refuses every other group, because such a run cannot see the holder's market.
 * Boundary: fails closed. A group this process has not registered (its keys not loaded) is refused, never treated as
 *           floor-free; a group with a floor-bearing key is refused with the fix (promote it, or apply it through the
 *           service, whose bound floor source reads the market). It reads no market pack and holds no number.
 * Runtime: node
 * Governing contract: ADR 0370 (decision 6); ADR 0395 (decision 5); config-model section 3 (floors are never skipped).
 */
import { Driver } from "@stackra/container";

import { SettingFloorSource } from "#contracts/index";
import type { SettingFloor } from "#contracts/index";
import { SETTING_KEY_REGISTRY } from "#core/constants/setting-key-registry.constant";

/**
 * Floors for a run that knows no market.
 *
 * @example
 * const resolver = new SettingsResolver(store, new RegisteredFloorGuardDriver(), revisions, clock);
 */
export class RegisteredFloorGuardDriver extends Driver(SettingFloorSource) {
  /**
   * See `SettingFloorSource.floors`.
   *
   * @throws TypeError when `group` is not registered in this process, or one of its keys declares a legal floor.
   */
  async floors(group: string): Promise<readonly SettingFloor[]> {
    const keys = SETTING_KEY_REGISTRY.get(group);
    if (keys === undefined)
      throw new TypeError(
        `The settings group ${group} is not registered in this process, so its legal floors are unknown: run the member's gen first`,
      );
    const floored = keys.filter((key) => key.floor !== undefined).map((key) => key.path);
    if (floored.length > 0)
      throw new TypeError(
        `The settings group ${group} has keys with legal floors (${floored.join(", ")}): apply it through the service or a promotion, which read the holder's market`,
      );
    return [];
  }
}
