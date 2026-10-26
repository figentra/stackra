/**
 * Stackra file contract:
 * Purpose: `SettingWriteOptions`, what a recorded settings write states besides its values: where it lands, who makes
 *          it and why, when it takes effect, and whether it is a break-glass change to live configuration.
 * Boundary: a type only. The author is the authenticated principal's public id, or `settingSystemAuthor(name)` for a
 *           write no person makes (a seeder), never request input. Whether the
 *           author may break glass (the owner with a step-up) is the calling action's check; the resolver only
 *           requires a reason and records it.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 5); ADR 0359 (decisions 3, 4 and 9); ADR 0419 (decision 1).
 */
import type { SettingEnvironment } from "#contracts/index";

/**
 * The options of `SettingsResolver#write`.
 *
 * @example
 * await resolver.write(SettingsPages.orders, { refundWindowDays: 30 }, { scope }, { environment: SettingEnvironment.Live, author });
 */
export interface SettingWriteOptions {
  /** Where the write lands. */
  readonly environment: SettingEnvironment;

  /** Who makes it: a principal's public id, or `settingSystemAuthor("seed")` for a seeder. */
  readonly author: string;

  /** Why; required for a break-glass change. */
  readonly reason?: string;

  /** When it takes effect; now when left out. */
  readonly effectiveAt?: Date;

  /** Whether it changes live configuration outside promotion (an incident; ADR 0359 decision 9). */
  readonly breakGlass?: boolean;
}
