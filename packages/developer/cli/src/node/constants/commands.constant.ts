/**
 * Stackra file contract:
 * Purpose: `COMMANDS`, every command the `stackra` binary has, in help order: new, gen, the member tool commands, the
 *          db commands, the seed-pack command, ls, and the local MCP and agent-file commands.
 * Boundary: data only. Figentra-internal operations (Linear, bot identities, merge, the secrets inbox, delegation)
 *           are never added here (ADR 0282 decision 4); `stackra db diff` and `seed` land with
 *           `@stackra/database`; infra is `stackra runway infra`, not a command here (ADR 0352).
 * Runtime: node
 * Governing contract: ADR 0282 (decisions 3 and 4); ADR 0083; registry v3.1 (cli ships thin, then grows).
 */
import { AGENTS_CHECK_COMMAND } from "#node/constants/agents-check-command.constant";
import { AGENTS_SYNC_COMMAND } from "#node/constants/agents-sync-command.constant";
import { DB_MIGRATE_COMMAND } from "#node/constants/db-migrate-command.constant";
import { DB_ROLLBACK_COMMAND } from "#node/constants/db-rollback-command.constant";
import { GEN_COMMAND } from "#node/constants/gen-command.constant";
import { LS_COMMAND } from "#node/constants/ls-command.constant";
import { MCP_COMMAND } from "#node/constants/mcp-command.constant";
import { MCP_EXEC_COMMAND } from "#node/constants/mcp-exec-command.constant";
import { MCP_SYNC_COMMAND } from "#node/constants/mcp-sync-command.constant";
import { NEW_COMMAND } from "#node/constants/new-command.constant";
import { SEED_PACK_COMMAND } from "#node/constants/seed-pack-command.constant";
import { toolCommand } from "#node/functions/tool-command.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The commands of `stackra`. */
export const COMMANDS: readonly CliCommand[] = [
  NEW_COMMAND,
  GEN_COMMAND,
  toolCommand("dev", "Generate, then serve the member (--target picks an app target)"),
  toolCommand("build", "Generate, then build the member"),
  toolCommand("start", "Generate, then preview an app's web build"),
  toolCommand("typecheck", "Generate, then type-check the member"),
  toolCommand("test", "Generate, then run the member's tests (--tier unit|e2e)"),
  toolCommand("lint", "Lint the member with oxlint"),
  DB_MIGRATE_COMMAND,
  DB_ROLLBACK_COMMAND,
  SEED_PACK_COMMAND,
  LS_COMMAND,
  MCP_COMMAND,
  MCP_SYNC_COMMAND,
  MCP_EXEC_COMMAND,
  AGENTS_SYNC_COMMAND,
  AGENTS_CHECK_COMMAND,
];
