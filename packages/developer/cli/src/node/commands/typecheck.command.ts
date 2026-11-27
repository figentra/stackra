/**
 * Stackra file contract:
 * Purpose: `TypecheckCommand`, `stackra typecheck`: type-check the member (in a workspace: every member through turbo), gen first when the member is configured; the exit code is the
 *          tool's. `--json`: the exit code and the tool's output as lines (the tool never takes the terminal then).
 * Boundary: the body is `toolCommand("typecheck")`, unchanged: it resolves the member's tool and starts it without a shell.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5); ADR 0282 (decision 3); ADR 0506; ADR 0500 (decision 7); STA-2883.
 */
import { Command, type CommandIo } from "@stackra/console";

import { runBody } from "#node/functions/run-body.function";
import { toolCommand } from "#node/functions/tool-command.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The body: gen, then the member's tool. */
const TYPECHECK_BODY = toolCommand("typecheck", "Generate, then type-check the member");

/** Type-checks the member. */
export class TypecheckCommand extends Command({
  name: "typecheck",
  description: TYPECHECK_BODY.summary,
  group: "Quality",
  bin: true,
  examples: ["stackra typecheck"],
}) {
  /** The body it runs, unchanged; every option the body reads is a field here. */
  static readonly body: CliCommand = TYPECHECK_BODY;

  /** Runs the tool; the exit code is its own. */
  handle(io: CommandIo): Promise<number> {
    return runBody(io, TYPECHECK_BODY, { values: {} });
  }
}
