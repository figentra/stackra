/**
 * Stackra file contract:
 * Purpose: `SettingsWrite`, one page write a `SettingsFake` recorded: the page, the scope it was written at and the
 *          values by field name.
 * Boundary: a type only, the shape a test compares `fake.writes` with.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (testing helpers per package); ADR 0307 (rule 24).
 */
import type { SettingLevel, SettingsPage } from "#core/index";

/**
 * One recorded write.
 *
 * @example
 * expect(settings.writes).toEqual([{ page: SettingsPages.messages, scope: SettingScope.User, values: { marketing: true } }]);
 */
export interface SettingsWrite {
  /** The page written. */
  readonly page: SettingsPage;

  /** The page's scope. */
  readonly scope: SettingLevel;

  /** The values by field name, as the caller passed them. */
  readonly values: Readonly<Record<string, unknown>>;
}
