/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/settings (`fakeSettings` and `fakeResolver`, and the fakes' types) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Test code only; the fake is built through `fakeSettings`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0269; the STA-347 stand-in barrel decision.
 */
export { fakeResolver } from "#testing/functions/fake-resolver.function";
export { fakeSettings } from "#testing/functions/fake-settings.function";
export type { SettingsClockFake } from "#testing/settings-clock.fake";
export type { SettingsFake } from "#testing/settings.fake";
export type { ResolverFake } from "#testing/types/resolver-fake.type";
export type { SettingsPatch } from "#testing/types/settings-patch.type";
export type { SettingsWrite } from "#testing/types/settings-write.type";
