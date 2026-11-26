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
 *           are not built yet; infrastructure is figentra/infra's Pulumi stacks, never a command here or in Runway (ADR
 *           0352 as amended 2026-11-07); `runway` itself runs @stackra/runway's commands
 *           (ADR 0529 decision 4, STA-2214).
 * Runtime: node
 * Governing contract: ADR 0282 (decisions 3 and 4); ADR 0083; registry v3.1 (cli ships thin, then grows); ADR 0506;
 *                     STA-1966.
 */
import { CONSOLE_COMMAND } from "#node/constants/console-command.constant";
import { DB_DIFF_COMMAND } from "#node/constants/db-diff-command.constant";
import { DB_SEED_COMMAND } from "#node/constants/db-seed-command.constant";
import { GEN_COMMAND } from "#node/constants/gen-command.constant";
import { MCP_COMMAND } from "#node/constants/mcp-command.constant";
import { MCP_EXEC_COMMAND } from "#node/constants/mcp-exec-command.constant";
import { NEW_COMMAND } from "#node/constants/new-command.constant";
import { SEED_PACK_COMMAND } from "#node/constants/seed-pack-command.constant";
import { TESTBED_COMMAND } from "#node/constants/testbed-command.constant";
import { VALIDATE_COMMAND } from "#node/constants/validate-command.constant";
import { DEV_COMMAND } from "#node/dev-surface/constants/dev-command.constant";
import { EAS_PREFLIGHT_COMMAND } from "#node/eas-preflight/constants/eas-preflight-command.constant";
import { BUILD_COMMAND } from "#node/product/constants/build-command.constant";
import { DEPLOY_COMMAND } from "#node/product/constants/deploy-command.constant";
import { PREVIEW_SERVE_COMMAND } from "#node/product/constants/preview-serve-command.constant";
import { AddCommand } from "#node/commands/add.command";
import { AgentsCheckCommand } from "#node/commands/agents-check.command";
import { AgentsSyncCommand } from "#node/commands/agents-sync.command";
import { AnyRatchetCommand } from "#node/commands/any-ratchet.command";
import { RowSecurityDeclarationsCommand } from "#node/commands/row-security-declarations.command";
import { AppNativeDepsCommand } from "#node/commands/app-native-deps.command";
import { ArchitectureMapCommand } from "#node/commands/architecture-map.command";
import { ConstitutionCommand } from "#node/commands/constitution.command";
import { EncorePrepareCommand } from "#node/commands/encore-prepare.command";
import { AuditVerifyCommand } from "#node/commands/audit-verify.command";
import { CatalogueCompletenessCommand } from "#node/commands/catalogue-completeness.command";
import { ConsumerGateCommand } from "#node/commands/consumer-gate.command";
import { CreateCommand } from "#node/commands/create.command";
import { CyclesCommand } from "#node/commands/cycles.command";
import { DbMigrateCommand } from "#node/commands/db-migrate.command";
import { DbRollbackCommand } from "#node/commands/db-rollback.command";
import { DevSecretsInitCommand } from "#node/commands/dev-secrets-init.command";
import { DocStandardCommand } from "#node/commands/doc-standard.command";
import { DoctorCommand } from "#node/commands/doctor.command";
import { DuplicateExportsCommand } from "#node/commands/duplicate-exports.command";
import { DuplicationCommand } from "#node/commands/duplication.command";
import { LsCommand } from "#node/commands/ls.command";
import { McpSyncCommand } from "#node/commands/mcp-sync.command";
import { MobileOnboardCommand } from "#node/commands/mobile-onboard.command";
import { OpsBootstrapOperatorCommand } from "#node/commands/ops-bootstrap-operator.command";
import { PromoteCommand } from "#node/commands/promote.command";
import { PublishCommand } from "#node/commands/publish.command";
import { RunwayCommand } from "#node/commands/runway.command";
import { SearchReindexCommand } from "#node/commands/search-reindex.command";
import { SearchStatusCommand } from "#node/commands/search-status.command";
import { SettingsApplyCommand } from "#node/commands/settings-apply.command";
import { SettingsDiffCommand } from "#node/commands/settings-diff.command";
import { SkillLicencesCommand } from "#node/commands/skill-licences.command";
import { SmokeCommand } from "#node/commands/smoke.command";
import { StructureCommand } from "#node/commands/structure.command";
import { checkCommand } from "#node/functions/check-command.function";
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
  DbMigrateCommand,
  DbRollbackCommand,
  DevSecretsInitCommand,
  DB_SEED_COMMAND,
  DB_DIFF_COMMAND,
  SEED_PACK_COMMAND,
  SettingsDiffCommand,
  SettingsApplyCommand,
  SearchReindexCommand,
  SearchStatusCommand,
  AuditVerifyCommand,
  DEPLOY_COMMAND,
  PromoteCommand,
  RunwayCommand,
  MobileOnboardCommand,
  SmokeCommand,
  PREVIEW_SERVE_COMMAND,
  OpsBootstrapOperatorCommand,
  LsCommand,
  TESTBED_COMMAND,
  ConsumerGateCommand,
  MCP_COMMAND,
  McpSyncCommand,
  MCP_EXEC_COMMAND,
  AgentsSyncCommand,
  AgentsCheckCommand,
  AddCommand,
  PublishCommand,
  DoctorCommand,
  EAS_PREFLIGHT_COMMAND,
  StructureCommand,
  ArchitectureMapCommand,
  ConstitutionCommand,
  EncorePrepareCommand,
  DocStandardCommand,
  CatalogueCompletenessCommand,
  CyclesCommand,
  AppNativeDepsCommand,
  DuplicateExportsCommand,
  AnyRatchetCommand,
  RowSecurityDeclarationsCommand,
  DuplicationCommand,
  SkillLicencesCommand,
];
