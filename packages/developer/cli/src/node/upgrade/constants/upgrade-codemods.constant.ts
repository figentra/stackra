/**
 * Stackra file contract:
 * Purpose: `UPGRADE_CODEMODS`, every upgrade entry `stackra upgrade` knows, oldest release first: an upgrade prints
 *          the note and runs the codemod of each entry whose release is after the workspace's version and at or before
 *          the target, in this order.
 * Boundary: data only. Every release note with a break mark (ADR 0013 decision 5) has an entry here, and
 *           `stackra upgrade-notes` (run by `pnpm validate`) refuses one without: a codemod that edits (`renames`) or
 *           reports (`report`) source has a fixture in `__tests__/fixtures/` that the fixture test runs; an entry with
 *           neither is a note, for a break nothing in a consumer's code can find or change mechanically. A new
 *           breaking changeset names its entry with `Upgrade entry: <id>`.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2 and Enforcement); ADR 0013 (decision 5); STA-145.
 */
import { ACTIONS_APPROVAL_GATE_PORT_CODEMOD } from "#node/upgrade/constants/actions-approval-gate-port-codemod.constant";
import { ACTIONS_IDEMPOTENCY_COMPLETE_REFUSED_CODEMOD } from "#node/upgrade/constants/actions-idempotency-complete-refused-codemod.constant";
import { CONFIG_INFISICAL_STORE_REMOVED_CODEMOD } from "#node/upgrade/constants/config-infisical-store-removed-codemod.constant";
import { CONFIG_SIGNER_DRIVERS_CODEMOD } from "#node/upgrade/constants/config-signer-drivers-codemod.constant";
import { DATABASE_SEED_PACK_STATUS_CODEMOD } from "#node/upgrade/constants/database-seed-pack-status-codemod.constant";
import { DEVICES_PAIRING_PICKUP_CODEMOD } from "#node/upgrade/constants/devices-pairing-pickup-codemod.constant";
import { EDGE_HEADER_GUARD_PUBLIC_PATHS_CODEMOD } from "#node/upgrade/constants/edge-header-guard-public-paths-codemod.constant";
import { GEN_AREA_ROUTES_CODEMOD } from "#node/upgrade/constants/gen-area-routes-codemod.constant";
import { GEN_ENCORE_DEV_DECLARED_CODEMOD } from "#node/upgrade/constants/gen-encore-dev-declared-codemod.constant";
import { GEN_GUARDED_HTTP_CODEMOD } from "#node/upgrade/constants/gen-guarded-http-codemod.constant";
import { GEN_INVARIANT_PLURALS_CODEMOD } from "#node/upgrade/constants/gen-invariant-plurals-codemod.constant";
import { GEN_QUEUE_PROVISIONED_CODEMOD } from "#node/upgrade/constants/gen-queue-provisioned-codemod.constant";
import { GEN_TOOL_REASON_CODEMOD } from "#node/upgrade/constants/gen-tool-reason-codemod.constant";
import { IDENTITY_ACCOUNT_SESSION_CODEMOD } from "#node/upgrade/constants/identity-account-session-codemod.constant";
import { INTEGRATIONS_PEER_CODEMOD } from "#node/upgrade/constants/integrations-peer-codemod.constant";
import { OUTBOX_ISOLATION_HELPERS_MOVE_CODEMOD } from "#node/upgrade/constants/outbox-isolation-helpers-move-codemod.constant";
import { OUTBOX_ROW_OWNERS_CODEMOD } from "#node/upgrade/constants/outbox-row-owners-codemod.constant";
import { PACKAGES_TENANCY_CONTRACT_STEP_CODEMOD } from "#node/upgrade/constants/packages-tenancy-contract-step-codemod.constant";
import { PEERS_NO_FORK_CODEMOD } from "#node/upgrade/constants/peers-no-fork-codemod.constant";
import { QUEUE_SCHEDULER_ROW_OWNERS_CODEMOD } from "#node/upgrade/constants/queue-scheduler-row-owners-codemod.constant";
import { RUNWAY_RUN_PROGRAM_CODEMOD } from "#node/upgrade/constants/runway-run-program-codemod.constant";
import { RUNWAY_SECRETS_FROM_SOPS_CODEMOD } from "#node/upgrade/constants/runway-secrets-from-sops-codemod.constant";
import { RUNWAY_UNREAD_FIELDS_DROPPED_CODEMOD } from "#node/upgrade/constants/runway-unread-fields-dropped-codemod.constant";
import { SEARCH_PRIVACY_ROW_OWNERS_CODEMOD } from "#node/upgrade/constants/search-privacy-row-owners-codemod.constant";
import { SERVICES_ENCORE_APP_ROOT_CODEMOD } from "#node/upgrade/constants/services-encore-app-root-codemod.constant";
import { SERVICES_ENCORE_IMPORTS_FIRST_TARGET_CODEMOD } from "#node/upgrade/constants/services-encore-imports-first-target-codemod.constant";
import { SERVICES_TSCONFIG_NO_BASE_URL_CODEMOD } from "#node/upgrade/constants/services-tsconfig-no-base-url-codemod.constant";
import { SETTINGS_ROW_OWNERS_CODEMOD } from "#node/upgrade/constants/settings-row-owners-codemod.constant";
import { SETTINGS_TYPED_FIELDS_CODEMOD } from "#node/upgrade/constants/settings-typed-fields-codemod.constant";
import { TENANCY_CONTRACT_ERRORS_CODEMOD } from "#node/upgrade/constants/tenancy-contract-errors-codemod.constant";
import { TENANCY_FACTORY_OWNER_ID_CODEMOD } from "#node/upgrade/constants/tenancy-factory-owner-id-codemod.constant";
import { TENANCY_MEMORY_TIER_ISOLATION_CODEMOD } from "#node/upgrade/constants/tenancy-memory-tier-isolation-codemod.constant";
import { UI_RICH_TEXT_ENTRY_CODEMOD } from "#node/upgrade/constants/ui-rich-text-entry-codemod.constant";
import { WEBHOOKS_ROW_OWNERS_CODEMOD } from "#node/upgrade/constants/webhooks-row-owners-codemod.constant";
import { WORKFLOW_AUTOMATION_QUOTA_CODEMOD } from "#node/upgrade/constants/workflow-automation-quota-codemod.constant";
import { WORKFLOW_JOURNAL_ROW_OWNERS_CODEMOD } from "#node/upgrade/constants/workflow-journal-row-owners-codemod.constant";
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** The entries, oldest release first. */
export const UPGRADE_CODEMODS: readonly UpgradeCodemod[] = [
  UI_RICH_TEXT_ENTRY_CODEMOD,
  ACTIONS_APPROVAL_GATE_PORT_CODEMOD,
  GEN_QUEUE_PROVISIONED_CODEMOD,
  DATABASE_SEED_PACK_STATUS_CODEMOD,
  RUNWAY_UNREAD_FIELDS_DROPPED_CODEMOD,
  IDENTITY_ACCOUNT_SESSION_CODEMOD,
  RUNWAY_RUN_PROGRAM_CODEMOD,
  GEN_ENCORE_DEV_DECLARED_CODEMOD,
  CONFIG_INFISICAL_STORE_REMOVED_CODEMOD,
  RUNWAY_SECRETS_FROM_SOPS_CODEMOD,
  DEVICES_PAIRING_PICKUP_CODEMOD,
  TENANCY_FACTORY_OWNER_ID_CODEMOD,
  INTEGRATIONS_PEER_CODEMOD,
  TENANCY_MEMORY_TIER_ISOLATION_CODEMOD,
  PEERS_NO_FORK_CODEMOD,
  GEN_TOOL_REASON_CODEMOD,
  GEN_GUARDED_HTTP_CODEMOD,
  PACKAGES_TENANCY_CONTRACT_STEP_CODEMOD,
  WEBHOOKS_ROW_OWNERS_CODEMOD,
  OUTBOX_ROW_OWNERS_CODEMOD,
  WORKFLOW_JOURNAL_ROW_OWNERS_CODEMOD,
  SETTINGS_TYPED_FIELDS_CODEMOD,
  ACTIONS_IDEMPOTENCY_COMPLETE_REFUSED_CODEMOD,
  GEN_AREA_ROUTES_CODEMOD,
  SERVICES_ENCORE_APP_ROOT_CODEMOD,
  SEARCH_PRIVACY_ROW_OWNERS_CODEMOD,
  QUEUE_SCHEDULER_ROW_OWNERS_CODEMOD,
  SETTINGS_ROW_OWNERS_CODEMOD,
  TENANCY_CONTRACT_ERRORS_CODEMOD,
  EDGE_HEADER_GUARD_PUBLIC_PATHS_CODEMOD,
  OUTBOX_ISOLATION_HELPERS_MOVE_CODEMOD,
  GEN_INVARIANT_PLURALS_CODEMOD,
  WORKFLOW_AUTOMATION_QUOTA_CODEMOD,
  CONFIG_SIGNER_DRIVERS_CODEMOD,
  SERVICES_TSCONFIG_NO_BASE_URL_CODEMOD,
  SERVICES_ENCORE_IMPORTS_FIRST_TARGET_CODEMOD,
];
