/**
 * Stackra file contract:
 * Purpose: `COMMANDS`, every command the `stackra` binary has, in help order: new, gen, the member tool commands (`dev`
 *          with its `--surface` mode, ADR 0436 decision 6), the
 *          check command and its aliases (validate, verify, code:check, code:fix), the db commands, the seed-pack
 *          command, the settings pack commands, the offline audit check, ls, the local MCP and agent-file commands,
 *          and the registry item commands (add, publish; ADR 0453).
 * Boundary: data only. Figentra-internal operations (Linear, bot identities, merge, the secrets inbox, delegation)
 *           are never added here (ADR 0282 decision 4); `stackra db diff` and `seed` land with
 *           `@stackra/database`; infra is `stackra runway infra`, not a command here (ADR 0352).
 * Runtime: node
 * Governing contract: ADR 0282 (decisions 3 and 4); ADR 0083; registry v3.1 (cli ships thin, then grows).
 */
import { AGENTS_CHECK_COMMAND } from "#node/constants/agents-check-command.constant";
import { AGENTS_SYNC_COMMAND } from "#node/constants/agents-sync-command.constant";
import { AUDIT_VERIFY_COMMAND } from "#node/constants/audit-verify-command.constant";
import { DB_MIGRATE_COMMAND } from "#node/constants/db-migrate-command.constant";
import { DB_ROLLBACK_COMMAND } from "#node/constants/db-rollback-command.constant";
import { GEN_COMMAND } from "#node/constants/gen-command.constant";
import { LS_COMMAND } from "#node/constants/ls-command.constant";
import { MCP_COMMAND } from "#node/constants/mcp-command.constant";
import { MCP_EXEC_COMMAND } from "#node/constants/mcp-exec-command.constant";
import { MCP_SYNC_COMMAND } from "#node/constants/mcp-sync-command.constant";
import { NEW_COMMAND } from "#node/constants/new-command.constant";
import { PUBLISH_COMMAND } from "#node/constants/publish-command.constant";
import { SEED_PACK_COMMAND } from "#node/constants/seed-pack-command.constant";
import { SETTINGS_APPLY_COMMAND } from "#node/constants/settings-apply-command.constant";
import { SETTINGS_DIFF_COMMAND } from "#node/constants/settings-diff-command.constant";
import { DEV_COMMAND } from "#node/dev-surface/constants/dev-command.constant";
import { addCommand } from "#node/functions/add-command.function";
import { checkCommand } from "#node/functions/check-command.function";
import { httpCatalogueClient } from "#node/functions/http-catalogue-client.function";
import { toolCommand } from "#node/functions/tool-command.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The commands of `stackra`. */
export const COMMANDS: readonly CliCommand[] = [
  NEW_COMMAND,
  GEN_COMMAND,
  DEV_COMMAND,
  toolCommand("build", "Generate, then build the member"),
  toolCommand("start", "Generate, then preview an app's web build"),
  toolCommand("typecheck", "Generate, then type-check the member"),
  toolCommand("test", "Generate, then run the member's tests (--tier unit|e2e)"),
  toolCommand("lint", "Lint the member with oxlint"),
  checkCommand(
    "check",
    "Run the quality gate: config, format, spelling, secrets, structure, docs, lint, gen, …",
  ),
  checkCommand(
    "validate",
    "Check the repository's shape (config, structure, docs, catalogues, spec)",
    {
      only: ["config", "structure", "docs", "catalogues", "spec"],
    },
  ),
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
  AUDIT_VERIFY_COMMAND,
  LS_COMMAND,
  MCP_COMMAND,
  MCP_SYNC_COMMAND,
  MCP_EXEC_COMMAND,
  AGENTS_SYNC_COMMAND,
  AGENTS_CHECK_COMMAND,
  addCommand(httpCatalogueClient),
  PUBLISH_COMMAND,
];
