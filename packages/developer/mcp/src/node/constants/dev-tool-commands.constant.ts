/**
 * Stackra file contract:
 * Purpose: `DEV_TOOL_COMMANDS`, the local MCP's own tools as console commands declared `tool`, in the order
 *          `tools/list` shows them: the readers (`app_info`, `manifest`, `routes`, and the dev log's `logs`,
 *          `last_error` and `browser_logs`, STA-2889) first, then the CLI commands an
 *          assistant runs (`new`, `gen`, `validate`, `check`, `verify`, `test`, `typecheck`, `lint`). `serveLocalMcp`
 *          serves them through `toolsOf`, so each tool's schema, hints and handler are its command's.
 * Boundary: data only. A tool the host passes with the same name (a CLI command declared `tool`) replaces the one
 *           here.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: local mode shares one core with the CLI); STA-1966 FR-020; STA-2873.
 */
import type { CommandClass } from "@stackra/console";

import { AppInfoCommand } from "#node/commands/app-info.command";
import { BrowserLogsCommand } from "#node/commands/browser-logs.command";
import { CheckCommand } from "#node/commands/check.command";
import { GenCommand } from "#node/commands/gen.command";
import { LastErrorCommand } from "#node/commands/last-error.command";
import { LintCommand } from "#node/commands/lint.command";
import { LogsCommand } from "#node/commands/logs.command";
import { ManifestCommand } from "#node/commands/manifest.command";
import { NewCommand } from "#node/commands/new.command";
import { RoutesCommand } from "#node/commands/routes.command";
import { TestCommand } from "#node/commands/test.command";
import { TypecheckCommand } from "#node/commands/typecheck.command";
import { ValidateCommand } from "#node/commands/validate.command";
import { VerifyCommand } from "#node/commands/verify.command";

/** The local MCP's own tool commands. */
export const DEV_TOOL_COMMANDS: readonly CommandClass[] = [
  AppInfoCommand,
  ManifestCommand,
  RoutesCommand,
  LogsCommand,
  LastErrorCommand,
  BrowserLogsCommand,
  NewCommand,
  GenCommand,
  ValidateCommand,
  CheckCommand,
  VerifyCommand,
  TestCommand,
  TypecheckCommand,
  LintCommand,
];
