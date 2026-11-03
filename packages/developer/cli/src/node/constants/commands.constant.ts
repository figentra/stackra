/**
 * Stackra file contract:
 * Purpose: `COMMANDS`, every command the `stackra` binary has (native console classes and the `CliCommand`s not yet ported), in help order: new, gen, console (a member's own console, STA-1731), the member tool commands (`dev`
 *          with its `--surface` mode, ADR 0436 decision 6), the
 *          check command and its aliases (validate, verify, code:check, code:fix), the product deploy, mobile onboard and
 *          preview serve commands (ADR 0482, STA-1676), the db commands, the seed-pack
 *          command, the settings pack commands, the search reindex and status commands, the offline audit check, the operator bootstrap (`ops
 *          bootstrap-operator`, STA-1586), ls, the testbed (`testbed <verb>`, ADR 0484), the consumer gate (`consumer-gate`, ADR 0500), the local MCP and agent-file commands,
 *          the registry item commands (add, publish; ADR 0453), and the repository commands moved from
 *          `tools/scripts` (doctor, eas-preflight, structure, architecture-map, the single checks `pnpm validate` runs
 *          and `validate --repository`).
 * Boundary: data only. Figentra-internal operations (Linear, bot identities, merge, the secrets inbox, delegation)
 *           are never added here (ADR 0282 decision 4); `stackra db seed` runs the member's seeders (STA-1709) and
 *           `stackra db diff` compares models with the migrations (STA-1808); `db structure` and `db diff --write`
 *           are not built yet; infra is `stackra runway infra`, not a command here (ADR 0352).
 * Runtime: node
 * Governing contract: ADR 0282 (decisions 3 and 4); ADR 0083; registry v3.1 (cli ships thin, then grows); ADR 0506;
 *                     STA-1966.
 */
import { AGENTS_SYNC_COMMAND } from "#node/constants/agents-sync-command.constant";
import { AUDIT_VERIFY_COMMAND } from "#node/constants/audit-verify-command.constant";
import { CONSOLE_COMMAND } from "#node/constants/console-command.constant";
import { DB_DIFF_COMMAND } from "#node/constants/db-diff-command.constant";
import { DB_MIGRATE_COMMAND } from "#node/constants/db-migrate-command.constant";
import { DB_ROLLBACK_COMMAND } from "#node/constants/db-rollback-command.constant";
import { DB_SEED_COMMAND } from "#node/constants/db-seed-command.constant";
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
import { CONSUMER_GATE_COMMAND } from "#node/consumer-gate/constants/consumer-gate-command.constant";
import { DEV_COMMAND } from "#node/dev-surface/constants/dev-command.constant";
import { EAS_PREFLIGHT_COMMAND } from "#node/eas-preflight/constants/eas-preflight-command.constant";
import { BUILD_COMMAND } from "#node/product/constants/build-command.constant";
import { DEPLOY_COMMAND } from "#node/product/constants/deploy-command.constant";
import { MOBILE_ONBOARD_COMMAND } from "#node/product/constants/mobile-onboard-command.constant";
import { SMOKE_COMMAND } from "#node/product/constants/smoke-command.constant";
import { PREVIEW_SERVE_COMMAND } from "#node/product/constants/preview-serve-command.constant";
import { AgentsCheckCommand } from "#node/commands/agents-check.command";
import { AnyRatchetCommand } from "#node/commands/any-ratchet.command";
import { AppNativeDepsCommand } from "#node/commands/app-native-deps.command";
import { ArchitectureMapCommand } from "#node/commands/architecture-map.command";
import { CatalogueCompletenessCommand } from "#node/commands/catalogue-completeness.command";
import { CreateCommand } from "#node/commands/create.command";
import { CyclesCommand } from "#node/commands/cycles.command";
import { DocStandardCommand } from "#node/commands/doc-standard.command";
import { DoctorCommand } from "#node/commands/doctor.command";
import { DuplicateExportsCommand } from "#node/commands/duplicate-exports.command";
import { DuplicationCommand } from "#node/commands/duplication.command";
import { SkillLicencesCommand } from "#node/commands/skill-licences.command";
import { StructureCommand } from "#node/commands/structure.command";
import { addCommand } from "#node/functions/add-command.function";
import { checkCommand } from "#node/functions/check-command.function";
import { httpCatalogueClient } from "#node/functions/http-catalogue-client.function";
import { toolCommand } from "#node/functions/tool-command.function";
import type { CliCommands } from "#node/types/cli-commands.type";

/** The commands of `stackra`. */
export const COMMANDS: CliCommands = [
  CreateCommand,
  NEW_COMMAND,
  GEN_COMMAND,
  CONSOLE_COMMAND,
  DEV_COMMAND,
  BUILD_COMMAND,
  toolCommand("start", "Generate, then preview an app's web build"),
  toolCommand("typecheck", "Generate, then type-check the member"),
  toolCommand("test", "Generate, then run the member's tests (--tier unit, int or e2e)"),
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
  DB_SEED_COMMAND,
  DB_DIFF_COMMAND,
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
  CONSUMER_GATE_COMMAND,
  MCP_COMMAND,
  MCP_SYNC_COMMAND,
  MCP_EXEC_COMMAND,
  AGENTS_SYNC_COMMAND,
  AgentsCheckCommand,
  addCommand(httpCatalogueClient),
  PUBLISH_COMMAND,
  DoctorCommand,
  EAS_PREFLIGHT_COMMAND,
  StructureCommand,
  ArchitectureMapCommand,
  DocStandardCommand,
  CatalogueCompletenessCommand,
  CyclesCommand,
  AppNativeDepsCommand,
  DuplicateExportsCommand,
  AnyRatchetCommand,
  DuplicationCommand,
  SkillLicencesCommand,
];
