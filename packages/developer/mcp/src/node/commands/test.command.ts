/**
 * Stackra file contract:
 * Purpose: `TestCommand`, the `test` tool of the local MCP: runs `stackra test` (gen first, then the member's tests;
 *          every member through Turborepo at the root) in the repository or one member, at a tier, and returns the run
 *          with the Vitest counts and each failure (file, test path, first error line) read from its output.
 * Boundary: runs through the CLI runner only, so the CLI's command applies; it writes what gen writes and nothing
 *           else. `tests` is null when the run stopped before Vitest printed a summary.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: run and explain failures); ADR 0182 (test tiers); STA-2873.
 */
import { Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { parseTestOutput } from "#node/functions/parse-test-output.function";
import { runToolCommand } from "#node/functions/run-tool-command.function";
import type { DevToolHost } from "#core/ports/dev-tool-host.port";

/** Runs the tests. */
export class TestCommand extends Command({
  name: "test",
  description:
    "Run `stackra test` (gen, then the tests) for the repository or one member; returns the counts and each failure",
  bin: true,
  tool: { readOnly: false, destructive: false, idempotent: true },
}) {
  /** The member to run in; every member when absent. */
  @Option({
    description: "A member: its key (`commerce`), package name or folder; every member when absent",
  })
  @Str
  member?: string;

  /** The test tier to run. */
  @Option({
    description: "The test tier; unit when absent (int runs in one member only)",
    choices: ["unit", "int", "e2e"],
  })
  @Str
  tier?: string;

  /** The server's runner and environment; absent when the kernel builds the command to read its fields. */
  private readonly host: DevToolHost | undefined;

  constructor(host: DevToolHost) {
    super();
    this.host = host;
  }

  /** Runs `stackra test` and reads its summary. */
  handle(io: CommandIo): Promise<number> {
    return runToolCommand(
      io,
      this.host,
      ["test", ...(this.tier === undefined ? [] : [`--tier=${this.tier}`])],
      {
        member: this.member,
        read: (output) => ({ tests: parseTestOutput(output) ?? null }),
      },
    );
  }
}
