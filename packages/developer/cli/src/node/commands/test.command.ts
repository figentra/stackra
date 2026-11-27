/**
 * Stackra file contract:
 * Purpose: `TestCommand`, `stackra test`: run the member's tests of one tier (in a workspace: every member through turbo), gen first when the member is configured; the exit code is the
 *          tool's. `--json`: the exit code and the tool's output as lines (the tool never takes the terminal then).
 * Boundary: the body is `toolCommand("test")`, unchanged: it resolves the member's tool and starts it without a shell.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5); ADR 0282 (decision 3); ADR 0506; ADR 0500 (decision 7); STA-2883.
 */
import { Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { runBody } from "#node/functions/run-body.function";
import { toolCommand } from "#node/functions/tool-command.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The body: gen, then the member's tool. */
const TEST_BODY = toolCommand(
  "test",
  "Generate, then run the member's tests (--tier unit, int or e2e)",
);

/** Runs the member's tests. */
export class TestCommand extends Command({
  name: "test",
  description: TEST_BODY.summary,
  group: "Quality",
  bin: true,
  examples: ["stackra test", "stackra test --tier int", "stackra test --json"],
}) {
  /** The body it runs, unchanged; every option the body reads is a field here. */
  static readonly body: CliCommand = TEST_BODY;

  /** The test tier. */
  @Option({
    description: "unit (default), int (with its services) or e2e; a workspace runs unit or e2e",
    choices: ["unit", "int", "e2e"],
  })
  @Str
  tier?: string;

  /** One of an app's targets. */
  @Option({ description: "The app target to test (an app with several)" })
  @Str
  target?: string;

  /** Runs the tool; the exit code is its own. */
  handle(io: CommandIo): Promise<number> {
    return runBody(io, TEST_BODY, {
      values: { tier: this.tier, target: this.target },
    });
  }
}
