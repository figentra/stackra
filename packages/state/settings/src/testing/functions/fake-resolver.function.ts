/**
 * Stackra file contract:
 * Purpose: `fakeResolver(options)`, the one way a test builds a `SettingsResolver`: the real resolver over memory
 *          value, floor, revision and entitlement drivers and a clock the test sets, seeded with root values and market
 *          floors by group and the plan's grants, to pass to `.override(SettingsResolver, ...)` or to call directly.
 * Boundary: a test helper. Floors are the test's own data, written as the market pack would answer them; nothing here
 *           holds a legal value. The drivers are returned so the test can write holders, read revisions and move time.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (testing helpers per package); ADR 0263 (`.override(Port, fake)`); ADR 0213
 *                     (decisions 2 and 5); ADR 0370 (decision 6); ADR 0420.
 */
import type { SettingFloor, SettingValue } from "#contracts/index";
import {
  MemorySettingEntitlementSourceDriver,
  MemorySettingFloorSourceDriver,
  MemorySettingRevisionStoreDriver,
  MemorySettingValueStoreDriver,
  SettingsResolver,
} from "#core/index";
import { SettingsClockFake } from "#testing/settings-clock.fake";
import type { ResolverFake } from "#testing/types/resolver-fake.type";

/**
 * A resolver over memory drivers.
 *
 * @example
 * const { resolver } = fakeResolver({
 *   values: { returns: { windowDays: 7 } },
 *   floors: { returns: [{ path: "windowDays", value: 14, bound: "min", law, market: "eu", version: "1.0.0" }] },
 * });
 * (await resolver.get(ReturnsSettings)).windowDays; // 14
 */
export function fakeResolver(
  options: {
    readonly values?: Readonly<Record<string, Readonly<Record<string, SettingValue>>>>;
    readonly floors?: Readonly<Record<string, readonly SettingFloor[]>>;
    readonly grants?: readonly string[];
    readonly now?: Date;
  } = {},
): ResolverFake {
  const values = new MemorySettingValueStoreDriver();
  for (const [group, seeded] of Object.entries(options.values ?? {})) values.seed(group, seeded);
  const floors = new MemorySettingFloorSourceDriver();
  for (const [group, seeded] of Object.entries(options.floors ?? {})) floors.seed(group, seeded);
  const revisions = new MemorySettingRevisionStoreDriver();
  const clock = new SettingsClockFake(options.now ?? new Date());
  const entitlements = new MemorySettingEntitlementSourceDriver().grant(...(options.grants ?? []));
  return {
    resolver: new SettingsResolver(values, floors, revisions, clock, entitlements),
    values,
    floors,
    entitlements,
    revisions,
    clock,
  };
}
