/**
 * Stackra file contract:
 * Purpose: `VersioningSettings`, the API version support period an operator sets without a deploy: how many months a
 *          version stays supported after its successor (`supportMonths`).
 * Boundary: a settings group of this package, keyed `versioning`, because its reader, the generated adapter, may not
 *           depend on settings; `SettingsVersionSupportSourceDriver` serves it through the `VersionSupportSource`
 *           port of `@stackra/contracts`. Held at the Platform scope only. Never sent to clients, never a secret. It
 *           registers its schema when the module loads (STA-339 replaces the registration).
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (API versions are dates); ADR 0307 (rules 22 to 24); ADR 0213 (decision 2).
 */
import { Int, registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { Settings } from "#core/bases/settings.base";
import { SettingScope } from "#core/enums/setting-scope.enum";

/**
 * The version support period.
 *
 * @example
 * const { supportMonths } = await this.settings.get(VersioningSettings);
 */
export class VersioningSettings extends Settings({
  scopes: [SettingScope.Platform],
}) {
  /** How many months a version stays supported after its successor. */
  @Int({ min: 1 })
  supportMonths = 12;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [VersioningSettings, z.object({ supportMonths: z.number().int().min(1).default(12) })],
]);
