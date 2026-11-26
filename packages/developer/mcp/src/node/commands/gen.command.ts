/**
 * Stackra file contract:
 * Purpose: `GenCommand`, the `gen` tool of the local MCP: runs `stackra gen` for the repository or one member,
 *          `--check` to fail on drift without writing, `--manifests` to write the manifests alone, and returns the run
 *          with each refusal and warning (file, place, code, message, fix) read from its output.
 * Boundary: runs through the CLI runner only, so gen's own gates apply; gen writes only generated files.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: run gen and explain failures); ADR 0294 (decision 22); STA-2873.
 */
import { Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { diagnosticsOf } from "#node/functions/diagnostics-of.function";
import { parseGenOutput } from "#node/functions/parse-gen-output.function";
import { runToolCommand } from "#node/functions/run-tool-command.function";
import type { DevToolHost } from "#core/ports/dev-tool-host.port";

/** Runs `stackra gen` as a tool. */
export class GenCommand extends Command({
  name: "gen",
  description:
    "Run `stackra gen` for the repository or one member (check: fail on drift, write nothing); returns each refusal",
  bin: true,
  tool: { readOnly: false, destructive: false, idempotent: true },
}) {
  /** Fail on drift instead of writing. */
  @Option({ description: "Fail on a refusal or a stale file instead of writing (the CI gate)" })
  check = false;

  /** Write the manifests alone. */
  @Option({ description: "Write the manifests alone (pass 1)" })
  manifests = false;

  /** The member to run in; every member when absent. */
  @Option({
    description: "A member: its key (`commerce`), package name or folder; every member when absent",
  })
  @Str
  member?: string;

  /** The server's runner and environment; absent when the kernel builds the command to read its fields. */
  private readonly host: DevToolHost | undefined;

  constructor(host: DevToolHost) {
    super();
    this.host = host;
  }

  /** Runs `stackra gen` and reads its refusals. */
  handle(io: CommandIo): Promise<number> {
    return runToolCommand(
      io,
      this.host,
      ["gen", ...(this.check ? ["--check"] : []), ...(this.manifests ? ["--manifests"] : [])],
      { member: this.member, read: (output) => diagnosticsOf(parseGenOutput(output)) },
    );
  }
}
