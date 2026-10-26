/**
 * Stackra file contract:
 * Purpose: `QuerySettings`, the runtime offline settings an admin tunes per scope without a deploy: the offline limit,
 *          the hours a device may go without a sync before it wipes its offline data and locks (ADR 0338 decision 4).
 * Boundary: this package's one settings group; its key is `query` and its setting `query.offlineLimitHours`, sent to
 *           clients (`client: true`) because `OfflineLock` reads it there. Resolved through the settings cascade: the
 *           platform's default, then a scope node below (the level tenancy contributes, never named here, R-59).
 *           Bounded, so a typo cannot wipe every device at once. Never a secret. It registers its schema when the
 *           module loads (STA-339 replaces the registration).
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 4); ADR 0307 (rules 22 to 24); ADR 0294 (decisions 16 and 20); ADR 0323.
 */
import { Setting, SettingScope, Settings } from "@stackra/settings";
import { Int, registerSchemas } from "@stackra/validation";
import { z } from "zod";

/**
 * The offline settings.
 *
 * @example
 * const { offlineLimitHours } = await this.settings.get(QuerySettings);
 */
export class QuerySettings extends Settings({
  scopes: [SettingScope.Platform, SettingScope.Node],
}) {
  /** Hours a device may go without a sync before its offline data is wiped and it locks. */
  @Int({
    min: 1,
    max: 720,
  })
  @Setting({
    client: true,
    lockable: true,
  })
  offlineLimitHours = 24;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [QuerySettings, z.object({ offlineLimitHours: z.number().int().min(1).max(720).default(24) })],
]);
