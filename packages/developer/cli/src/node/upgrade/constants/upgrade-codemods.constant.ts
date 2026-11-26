/**
 * Stackra file contract:
 * Purpose: `UPGRADE_CODEMODS`, every codemod `stackra upgrade` knows, oldest release first: an upgrade runs those
 *          whose release is after the workspace's version and at or before the target, in this order.
 * Boundary: data only. A breaking change in a release adds its codemod here, with a fixture in
 *           `__tests__/fixtures/` that the fixture test runs (every id needs one), or a note-only entry when nothing
 *           in a consumer's code can be found or changed mechanically.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5: a note per breaking release); STA-145.
 */
import { ACTIONS_APPROVAL_GATE_PORT_CODEMOD } from "#node/upgrade/constants/actions-approval-gate-port-codemod.constant";
import { ACTIONS_IDEMPOTENCY_COMPLETE_REFUSED_CODEMOD } from "#node/upgrade/constants/actions-idempotency-complete-refused-codemod.constant";
import { CONFIG_INFISICAL_STORE_REMOVED_CODEMOD } from "#node/upgrade/constants/config-infisical-store-removed-codemod.constant";
import { GEN_AREA_ROUTES_CODEMOD } from "#node/upgrade/constants/gen-area-routes-codemod.constant";
import { IDENTITY_ACCOUNT_SESSION_CODEMOD } from "#node/upgrade/constants/identity-account-session-codemod.constant";
import { SERVICES_ENCORE_APP_ROOT_CODEMOD } from "#node/upgrade/constants/services-encore-app-root-codemod.constant";
import { SERVICES_TSCONFIG_NO_BASE_URL_CODEMOD } from "#node/upgrade/constants/services-tsconfig-no-base-url-codemod.constant";
import { UI_RICH_TEXT_ENTRY_CODEMOD } from "#node/upgrade/constants/ui-rich-text-entry-codemod.constant";
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** The codemods, oldest release first. */
export const UPGRADE_CODEMODS: readonly UpgradeCodemod[] = [
  UI_RICH_TEXT_ENTRY_CODEMOD,
  ACTIONS_APPROVAL_GATE_PORT_CODEMOD,
  IDENTITY_ACCOUNT_SESSION_CODEMOD,
  CONFIG_INFISICAL_STORE_REMOVED_CODEMOD,
  ACTIONS_IDEMPOTENCY_COMPLETE_REFUSED_CODEMOD,
  GEN_AREA_ROUTES_CODEMOD,
  SERVICES_ENCORE_APP_ROOT_CODEMOD,
  SERVICES_TSCONFIG_NO_BASE_URL_CODEMOD,
];
