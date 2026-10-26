/**
 * Stackra file contract:
 * Purpose: `MarketPackSettingFloorSourceDriver`, a `SettingFloorSource` over one holder's resolved market pack: the
 *          floors in force today on a group's registered keys, through `settingFloorsOf`. It lets a run that knows the
 *          holder's market (the `stackra settings:apply` runner given `--market`) apply a floor-bearing group.
 * Boundary: one resolved pack for every target, so it serves a run at one holder; a booted service binds the OS driver
 *           that reads each tenant's pin instead. A group whose keys are not registered in this process is refused,
 *           never treated as floor-free (fail closed, as `RegisteredFloorGuardDriver`). The date is the clock's UTC
 *           day. Floors are pack data; no number here.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 6); ADR 0395 (decision 5); ADR 0419 (decision 2); config-model section 3.
 */
import { Driver } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import type { ResolvedPack } from "@stackra/market-packs";

import { SettingFloorSource } from "#contracts/index";
import type { SettingFloor } from "#contracts/index";
import { SETTING_KEY_REGISTRY } from "#core/constants/setting-key-registry.constant";
import { settingFloorsOf } from "#core/functions/setting-floors-of.function";

/**
 * Floors from one resolved market pack.
 *
 * @example
 * const floors = new MarketPackSettingFloorSourceDriver(resolvePack(packs, "sa"), new SystemClockDriver());
 */
export class MarketPackSettingFloorSourceDriver extends Driver(SettingFloorSource) {
  /** The holder's resolved pack. */
  private readonly pack: ResolvedPack;

  /** The one source of today. */
  private readonly clock: Clock;

  /**
   * @param pack - the holder's resolved market pack.
   * @param clock - the clock whose UTC day picks the floors in force.
   */
  constructor(pack: ResolvedPack, clock: Clock) {
    super();
    this.pack = pack;
    this.clock = clock;
  }

  /**
   * See `SettingFloorSource.floors`.
   *
   * @throws TypeError when `group` is not registered in this process, or a matched floor cannot bound a setting.
   */
  async floors(group: string): Promise<readonly SettingFloor[]> {
    const keys = SETTING_KEY_REGISTRY.get(group);
    if (keys === undefined)
      throw new TypeError(
        `The settings group ${group} is not registered in this process, so its legal floors are unknown: run the member's gen first`,
      );
    const today = this.clock.now().toISOString().slice(0, 10);
    return settingFloorsOf(this.pack, today, keys).get(group) ?? [];
  }
}
