/**
 * Stackra file contract:
 * Purpose: `CREATE_COMMAND`, `stackra create <directory>` (`npx @stackra/cli create <directory>`): a new Stackra app in
 *          an empty folder, run by `CreateCommand` through `@stackra/console`.
 * Boundary: data plus dispatch.
 * Runtime: node
 * Governing contract: ADR 0515; STA-1952 spec User Story 1.
 */
import { CreateCommand } from "#node/commands/create.command";
import { consoleCommand } from "#node/functions/console-command.function";

/** The `stackra create` command. */
export const CREATE_COMMAND = consoleCommand(
  CreateCommand,
  "Create a new Stackra app in an empty folder: starter, install, gen (shown as a tree), checks, first commit",
  "stackra create <directory> [--name <n>] [--scope @<s>] [--edition free|pro] [--pm pnpm] [--profile minimal|full] [--yes] [--starter <dir|tgz>] [--tarballs <dir>] [--no-doctor] [--no-install] [--no-check] [--no-git]",
);
