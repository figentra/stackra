/**
 * Stackra file contract:
 * Purpose: `COMMANDS`, every command the `stackra` binary has, in help order: new, gen, the member tool commands (`dev`
 *          with its `--surface` mode, ADR 0436 decision 6), the
 *          check command and its aliases (validate, verify, code:check, code:fix), the product deploy, mobile onboard and
 *          preview serve commands (ADR 0482, STA-1676), the db commands, the seed-pack
 *          command, the settings pack commands, the search reindex and status commands, the offline audit check, the operator bootstrap (`ops
 *          bootstrap-operator`, STA-1586), ls, the testbed (`testbed <verb>`, ADR 0484), the local MCP and agent-file commands,
 *          the registry item commands (add, publish; ADR 0453), and the repository commands moved from
 *          `tools/scripts` (doctor, eas-preflight, structure, architecture-map, the single checks `pnpm validate` runs
 *          and `validate --repository`).
 * Boundary: data only. Figentra-internal operations (Linear, bot identities, merge, the secrets inbox, delegation)
 *           are never added here (ADR 0282 decision 4); `stackra db diff` and `seed` land with
 *           `@stackra/database`; infra is `stackra runway infra`, not a command here (ADR 0352).
 * Runtime: node
 * Governing contract: ADR 0282 (decisions 3 and 4); ADR 0083; registry v3.1 (cli ships thin, then grows).
 */
import { AGENTS_CHECK_COMMAND } from "#node/constants/agents-check-command.constant";
import { AGENTS_SYNC_COMMAND } from "#node/constants/agents-sync-command.constant";
import { ANY_RATCHET_COMMAND } from "#node/any-ratchet/constants/any-ratchet-command.constant";
import { APP_NATIVE_DEPS_COMMAND } from "#node/app-native-deps/constants/app-native-deps-command.constant";
import { ARCHITECTURE_MAP_COMMAND } from "#node/architecture-map/constants/architecture-map-command.constant";
import { AUDIT_VERIFY_COMMAND } from "#node/constants/audit-verify-command.constant";
import { CATALOGUE_COMPLETENESS_COMMAND } from "#node/constants/catalogue-completeness-command.constant";
import { DB_MIGRATE_COMMAND } from "#node/constants/db-migrate-command.constant";
import { DB_ROLLBACK_COMMAND } from "#node/constants/db-rollback-command.constant";
import { DOC_STANDARD_COMMAND } from "#node/constants/doc-standard-command.constant";
import { GEN_COMMAND } from "#node/constants/gen-command.constant";
import { LS_COMMAND } from "#node/constants/ls-command.constant";
import { MCP_COMMAND } from "#node/constants/mcp-command.constant";
import { MCP_EXEC_COMMAND } from "#node/constants/mcp-exec-command.constant";
import { MCP_SYNC_COMMAND } from "#node/constants/mcp-sync-command.constant";
import { NEW_COMMAND } from "#node/constants/new-command.constant";
import { OPS_BOOTSTRAP_OPERATOR_COMMAND } from "#node/constants/ops-bootstrap-operator-command.constant";
import { PUBLISH_COMMAND } from "#node/constants/publish-command.constant";
import { SEARCH_REINDEX_COMMAND } from "#node/constants/search-reindex-command.constant";
import { SEARCH_STATUS_COMMAND } from "#node/constants/search-status-command.constant";
import { SEED_PACK_COMMAND } from "#node/constants/seed-pack-command.constant";
import { SETTINGS_APPLY_COMMAND } from "#node/constants/settings-apply-command.constant";
import { SETTINGS_DIFF_COMMAND } from "#node/constants/settings-diff-command.constant";
import { TESTBED_COMMAND } from "#node/constants/testbed-command.constant";
import { VALIDATE_COMMAND } from "#node/constants/validate-command.constant";
import { CYCLES_COMMAND } from "#node/cycles/constants/cycles-command.constant";
import { DEV_COMMAND } from "#node/dev-surface/constants/dev-command.constant";
import { DOCTOR_COMMAND } from "#node/doctor/constants/doctor-command.constant";
import { DUPLICATE_EXPORTS_COMMAND } from "#node/duplicate-exports/constants/duplicate-exports-command.constant";
import { DUPLICATION_COMMAND } from "#node/duplication/constants/duplication-command.constant";
import { EAS_PREFLIGHT_COMMAND } from "#node/eas-preflight/constants/eas-preflight-command.constant";
import { BUILD_COMMAND } from "#node/product/constants/build-command.constant";
import { DEPLOY_COMMAND } from "#node/product/constants/deploy-command.constant";
import { MOBILE_ONBOARD_COMMAND } from "#node/product/constants/mobile-onboard-command.constant";
import { SMOKE_COMMAND } from "#node/product/constants/smoke-command.constant";
import { PREVIEW_SERVE_COMMAND } from "#node/product/constants/preview-serve-command.constant";
import { addCommand } from "#node/functions/add-command.function";
import { checkCommand } from "#node/functions/check-command.function";
import { httpCatalogueClient } from "#node/functions/http-catalogue-client.function";
import { toolCommand } from "#node/functions/tool-command.function";
import { SKILL_LICENCES_COMMAND } from "#node/skill-licences/constants/skill-licences-command.constant";
import { STRUCTURE_COMMAND } from "#node/structure/constants/structure-command.constant";
import type { CliCommand } from "#node/types/cli-command.type";

/** The commands of `stackra`. */
export const COMMANDS: readonly CliCommand[] = [
  NEW_COMMAND,
  GEN_COMMAND,
  DEV_COMMAND,
  BUILD_COMMAND,
  toolCommand("start", "Generate, then preview an app's web build"),
  toolCommand("typecheck", "Generate, then type-check the member"),
  toolCommand("test", "Generate, then run the member's tests (--tier unit|e2e)"),
  toolCommand("lint", "Lint the member with oxlint"),
  checkCommand(
    "check",
    "Run the quality gate: config, format, spelling, secrets, structure, docs, lint, gen, …",
  ),
  VALIDATE_COMMAND,
  checkCommand("verify", "Run every check phase, tests included (`stackra check --with-tests`)", {
    withTests: true,
  }),
  checkCommand("code:check", "Check formatting and lint (`stackra check --only format,lint`)", {
    only: ["format", "lint"],
  }),
  checkCommand(
    "code:fix",
    "Format and apply lint fixes (`stackra check --only format,lint --fix`)",
    {
      only: ["format", "lint"],
      fix: true,
    },
  ),
  DB_MIGRATE_COMMAND,
  DB_ROLLBACK_COMMAND,
  SEED_PACK_COMMAND,
  SETTINGS_DIFF_COMMAND,
  SETTINGS_APPLY_COMMAND,
  SEARCH_REINDEX_COMMAND,
  SEARCH_STATUS_COMMAND,
  AUDIT_VERIFY_COMMAND,
  DEPLOY_COMMAND,
  MOBILE_ONBOARD_COMMAND,
  SMOKE_COMMAND,
  PREVIEW_SERVE_COMMAND,
  OPS_BOOTSTRAP_OPERATOR_COMMAND,
  LS_COMMAND,
  TESTBED_COMMAND,
  MCP_COMMAND,
  MCP_SYNC_COMMAND,
  MCP_EXEC_COMMAND,
  AGENTS_SYNC_COMMAND,
  AGENTS_CHECK_COMMAND,
  addCommand(httpCatalogueClient),
  PUBLISH_COMMAND,
  DOCTOR_COMMAND,
  EAS_PREFLIGHT_COMMAND,
  STRUCTURE_COMMAND,
  ARCHITECTURE_MAP_COMMAND,
  DOC_STANDARD_COMMAND,
  CATALOGUE_COMPLETENESS_COMMAND,
  CYCLES_COMMAND,
  APP_NATIVE_DEPS_COMMAND,
  DUPLICATE_EXPORTS_COMMAND,
  ANY_RATCHET_COMMAND,
  DUPLICATION_COMMAND,
  SKILL_LICENCES_COMMAND,
];
