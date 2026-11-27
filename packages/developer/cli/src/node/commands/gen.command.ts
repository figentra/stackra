/**
 * Stackra file contract:
 * Purpose: `GenCommand`, `stackra gen [--check] [--manifests] [--backend tsgo|ts6]`: generates every configured member
 *          (one at a member root, each installed one at a workspace root) through `GEN_COMMAND`, gen's manifest pass then
 *          its rounds; `--check` writes nothing and fails on a stale file. `--json`: each member's outcome, every
 *          refusal and warning with its code, file, line, column and fix.
 * Boundary: parses nothing itself; the body prints exactly as before and gen writes only under each member.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 10, 22 and 26); ADR 0506; ADR 0500 (decision 7); STA-1232; STA-2883.
 */
import { Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { GEN_COMMAND } from "#node/constants/gen-command.constant";
import { runBody } from "#node/functions/run-body.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** Generates the members. */
export class GenCommand extends Command({
  name: "gen",
  description: GEN_COMMAND.summary,
  group: "Develop",
  bin: true,
  examples: ["stackra gen", "stackra gen --check", "stackra gen --check --json"],
}) {
  /** The body it runs, unchanged; every option the body reads is a field here. */
  static readonly body: CliCommand = GEN_COMMAND;

  /** Compare instead of writing. */
  @Option({ description: "Write nothing; fail when a generated file is stale (CI)" })
  check = false;

  /** The manifest pass alone. */
  @Option({ description: "Write the manifests only (gen's first pass)" })
  manifests = false;

  /** The TypeScript host. */
  @Option({
    description: "The TypeScript host gen reads the member with",
    choices: ["tsgo", "ts6"],
  })
  @Str
  backend?: string;

  /** Runs gen; the exit code is 1 on a refusal or a stale file. */
  handle(io: CommandIo): Promise<number> {
    return runBody(io, GEN_COMMAND, {
      values: { check: this.check, manifests: this.manifests, backend: this.backend },
    });
  }
}
