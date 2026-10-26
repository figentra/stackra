/**
 * Stackra file contract:
 * Purpose: `ResolverFake`, what `fakeResolver` returns: a real `SettingsResolver` and the memory drivers and clock
 *          behind it, so a test seeds values and floors, reads revisions and moves time.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (testing helpers per package); ADR 0213 (decisions 2 and 5); ADR 0370 (decision 6).
 */
import type {
  MemorySettingFloorSourceDriver,
  MemorySettingRevisionStoreDriver,
  MemorySettingValueStoreDriver,
  SettingsResolver,
} from "#core/index";
import type { SettingsClockFake } from "#testing/settings-clock.fake";

/** A resolver over memory drivers. */
export interface ResolverFake {
  /** The resolver under test: floors, locks, live checks, approval and schedules all real. */
  readonly resolver: SettingsResolver;

  /** Where the values live; `seed` sets root values, `write` a holder's. */
  readonly values: MemorySettingValueStoreDriver;

  /** The market floors; `seed` sets a group's. */
  readonly floors: MemorySettingFloorSourceDriver;

  /** Every revision the resolver recorded. */
  readonly revisions: MemorySettingRevisionStoreDriver;

  /** The time the resolver reads. */
  readonly clock: SettingsClockFake;
}
