/**
 * Stackra file contract:
 * Purpose: the stand-in for what `stackra gen` writes from `SupportSettings` in an app: the group's schema with its
 *          defaults and bounds (`#stackra/schemas`), its keys (`#stackra/settings`) and the tenant's settings page the
 *          generated `support.settings.update` operation writes through (`SupportTenantPage`).
 * Boundary: test support only; loading it registers the schema and the keys once.
 * Runtime: node (vitest)
 * Governing contract: ADR 0213; ADR 0307 (rules 22 to 24); ADR 0294 (decision 15: gen writes them); STA-2852.
 */
import type { I18nKey } from "@stackra/i18n";
import { SettingScope, SettingType, settingKeys, settingsPage } from "@stackra/settings";
import { TenancyScopes } from "@stackra/tenancy";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { SupportSettings } from "../support.settings";

registerSchemas([
  [
    SupportSettings,
    z.object({
      firstReplyHours: z.number().int().min(1).max(168).default(24),
      surveysEnabled: z.boolean().default(true),
    }),
  ],
]);

const levels = [SettingScope.Platform, TenancyScopes.Tenant];

settingKeys({
  support: {
    firstReplyHours: {
      type: SettingType.Integer,
      default: 24,
      min: 1,
      max: 168,
      scopes: levels,
      label: "support::settings.first_reply_hours.label" as I18nKey,
    },
    surveysEnabled: {
      type: SettingType.Boolean,
      default: true,
      client: true,
      scopes: levels,
      label: "support::settings.surveys_enabled.label" as I18nKey,
    },
  },
});

/** The tenant's support settings page. */
export const SupportTenantPage = settingsPage("support", { scope: TenancyScopes.Tenant });
