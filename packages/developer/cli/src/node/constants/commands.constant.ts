/**
 * Stackra file contract:
 * Purpose: `COMMANDS`, every command the `stackra` binary has, each a native console command class (no passthrough command is
 *          left, ADR 0500 decision 7; `runway` mounts Runway's own console by design), in help order: new, gen, console (a member's own console, STA-1731), the member tool commands (`dev`
 *          with its `--surface` mode, ADR 0436 decision 6), the
 *          check command and its aliases (validate, verify, code:check, code:fix), the product deploy, mobile onboard and
 *          preview serve commands (ADR 0482, STA-1676), the db commands, the seed-pack
 *          command, the settings pack commands, the search reindex and status commands, the offline audit check, the operator bootstrap (`ops
 *          bootstrap-operator`, STA-1586), ls, the testbed (`testbed <verb>`, ADR 0484), the consumer gate (`consumer-gate`, ADR 0500), the local MCP and agent-file commands,
 *          the registry item commands (add, publish; ADR 0453), and the repository commands moved from
 *          `tools/scripts` (doctor, eas-preflight, structure, architecture-map, the single checks `pnpm validate` runs
 *          and `validate --repository`). Each names its `stackra list` heading (`COMMAND_GROUPS`); the check presets
 *          and the commands a script, hook or agent client runs (mcp, mcp exec, mcp sync, agents sync and check) are
 *          hidden from the list and still run by name (STA-2872).
 * Boundary: data only. Figentra-internal operations (Linear, bot identities, merge, the secrets inbox, delegation)
 *           are never added here (ADR 0282 decision 4); `stackra db seed` runs the member's seeders (STA-1709) and
 *           `stackra db diff` compares models with the migrations (STA-1808); `db structure` and `db diff --write`
 *           are not built yet; infrastructure is figentra/infra's Pulumi stacks, never a command here or in Runway (ADR
 *           0352 as amended 2026-11-07); `runway` itself runs @stackra/runway's commands
 *           (ADR 0529 decision 4, STA-2214).
 * Runtime: node
 * Governing contract: ADR 0282 (decisions 3 and 4); ADR 0083; registry v3.1 (cli ships thin, then grows); ADR 0506;
 *                     STA-1966; STA-2872 spec FR-001 and FR-002; STA-2883.
 */
import { BuildCommand } from "#node/commands/build.command";
import { CheckCommand } from "#node/commands/check.command";
import { CodeCheckCommand } from "#node/commands/code-check.command";
import { CodeFixCommand } from "#node/commands/code-fix.command";
import { ConsoleCommand } from "#node/commands/console.command";
import { DbDiffCommand } from "#node/commands/db-diff.command";
import { DbSeedCommand } from "#node/commands/db-seed.command";
import { DeployCommand } from "#node/commands/deploy.command";
import { DevCommand } from "#node/commands/dev.command";
import { EasPreflightCommand } from "#node/commands/eas-preflight.command";
import { GenCommand } from "#node/commands/gen.command";
import { LintCommand } from "#node/commands/lint.command";
import { McpCommand } from "#node/commands/mcp.command";
import { McpExecCommand } from "#node/commands/mcp-exec.command";
import { NewCommand } from "#node/commands/new.command";
import { PreviewServeCommand } from "#node/commands/preview-serve.command";
import { SeedPackCommand } from "#node/commands/seed-pack.command";
import { StartCommand } from "#node/commands/start.command";
import { TestCommand } from "#node/commands/test.command";
import { TestbedCommand } from "#node/commands/testbed.command";
import { TypecheckCommand } from "#node/commands/typecheck.command";
import { ValidateCommand } from "#node/commands/validate.command";
import { VerifyCommand } from "#node/commands/verify.command";
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
import type { CliCommands } from "#node/types/cli-commands.type";

/** The commands of `stackra`. */
export const COMMANDS: CliCommands = [
  CreateCommand,
  NewCommand,
  GenCommand,
  ConsoleCommand,
  DevCommand,
  BuildCommand,
  StartCommand,
  TypecheckCommand,
  TestCommand,
  LintCommand,
  CheckCommand,
  ValidateCommand,
  VerifyCommand,
  CodeCheckCommand,
  CodeFixCommand,
  DbMigrateCommand,
  DbRollbackCommand,
  DevSecretsInitCommand,
  DbSeedCommand,
  DbDiffCommand,
  SeedPackCommand,
  SettingsDiffCommand,
  SettingsApplyCommand,
  SearchReindexCommand,
  SearchStatusCommand,
  AuditVerifyCommand,
  DeployCommand,
  PromoteCommand,
  RunwayCommand,
  MobileOnboardCommand,
  SmokeCommand,
  PreviewServeCommand,
  OpsBootstrapOperatorCommand,
  LsCommand,
  TestbedCommand,
  ConsumerGateCommand,
  McpCommand,
  McpSyncCommand,
  McpExecCommand,
  AgentsSyncCommand,
  AgentsCheckCommand,
  AddCommand,
  PublishCommand,
  DoctorCommand,
  EasPreflightCommand,
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
