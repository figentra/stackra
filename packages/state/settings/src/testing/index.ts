/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/settings (`fakeSettings` and the fake's types) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Test code only; the fake is built through `fakeSettings`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0269; the STA-347 stand-in barrel decision.
 */
export { fakeSettings } from "#testing/functions/fake-settings.function";
export type { SettingsFake } from "#testing/settings.fake";
export type { SettingsPatch } from "#testing/types/settings-patch.type";
export type { SettingsWrite } from "#testing/types/settings-write.type";
