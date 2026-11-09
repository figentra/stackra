/**
 * Stackra file contract:
 * Purpose: `IdempotencySettings`, the idempotency retention window an operator sets without a deploy: how many hours
 *          the action pipeline keeps an Idempotency-Key with its result (`retentionHours`).
 * Boundary: a settings group of this package, keyed `idempotency`, because its reader, the action pipeline, may not
 *           depend on settings; `SettingsIdempotencyRetentionSourceDriver` serves it through the
 *           `IdempotencyRetentionSource` port of `@stackra/contracts`. Held at the Platform scope only: the window is
 *           the platform's, not a tenant's. The maximum is 24 because ADR 0136 caps the window at 24 hours, so the
 *           setting can only shorten it (an action's own `idempotencyTtl` can shorten it further). Never sent to
 *           clients, never a secret. It registers its schema when the module loads (STA-339 replaces the registration).
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 3: stored for 24 hours); ADR 0307 (rules 22 to 24); ADR 0213 (decision 2);
 *                     ADR 0294 (decisions 16 and 20).
 */
import { Int, registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { Settings } from "#core/bases/settings.base";
import { SettingScope } from "#core/enums/setting-scope.enum";

/**
 * The idempotency retention window.
 *
 * @example
 * const { retentionHours } = await this.settings.get(IdempotencySettings);
 */
export class IdempotencySettings extends Settings({
  scopes: [SettingScope.Platform],
}) {
  /** How many hours an Idempotency-Key and its result are kept; at most 24 (ADR 0136). */
  @Int({
    min: 1,
    max: 24,
  })
  retentionHours = 24;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [IdempotencySettings, z.object({ retentionHours: z.number().int().min(1).max(24).default(24) })],
]);
