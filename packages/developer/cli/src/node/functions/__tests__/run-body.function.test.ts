/**
 * Stackra file contract:
 * Purpose: unit tests of `runBody`: the body gets its options by flag name (a false or absent flag left out), its
 *          positionals and the words after `--`; its writes reach the streams byte for byte; a `CliUsageError` exits 2
 *          with the body's usage; and under `--json` standard output holds the document alone, whose data is what the
 *          body reports, else `toData` of its output, else the exit code and the output as lines.
 * Boundary: test only; fake bodies, run through the console's test runner.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0506; ADR 0500 (decision 7); STA-2883.
 */
import { Argument, Command, Option, type CommandIo } from "@stackra/console";
import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";
import { List, Str } from "@stackra/validation";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { runBody } from "#node/functions/run-body.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** What the last body run got. */
let seen: { values: unknown; positionals: unknown; rest: unknown } | undefined;

/** A body that records its context, prints a line to each stream and reports when `--report` is given. */
const BODY: CliCommand = {
  name: "probe",
  summary: "Probe",
  usage: "stackra probe [--mode <m>] [--loud] [--report] [words…]",
  options: { mode: { type: "string" }, loud: { type: "boolean" }, report: { type: "boolean" } },
  positionals: true,
  run: async ({ values, positionals, rest, io, report }) => {
    seen = { values, positionals, rest };
    if (values["mode"] === "misuse") throw new CliUsageError("that mode is not one");
    io.out("first line\nsecond line\n");
    io.err("a note\n");
    if (values["report"] === true) report?.({ reported: true });
    return values["mode"] === "fail" ? 3 : 0;
  },
};

/** Runs `BODY`; `--parse` reads its output as `key=value` data. */
class ProbeCommand extends Command({
  name: "probe",
  description: BODY.summary,
}) {
  @Option({ description: "The mode" })
  @Str
  mode?: string;

  @Option({ description: "Loud" })
  loud = false;

  @Option({ description: "Report data" })
  report = false;

  @Option({ description: "Read the output as data" })
  parse = false;

  @Argument({ description: "Words" })
  @List
  words: string[] = [];

  handle(io: CommandIo): Promise<number> {
    return runBody(io, BODY, {
      values: { mode: this.mode, loud: this.loud, report: this.report },
      positionals: this.words.slice(0, 1),
      rest: this.words.slice(1),
      ...(this.parse ? { toData: (output: string) => ({ lines: output.trim().split("\n") }) } : {}),
    });
  }
}

const probe = (...argv: string[]) => runCommandForTest([ProbeCommand], ["probe", ...argv]);

describe("runBody", () => {
  // @covers sta-2883:FR-007
  it("hands the body its given options by flag name, its positionals and the rest", async () => {
    await probe("--mode", "x", "a", "b", "c");
    expect(seen).toEqual({ values: { mode: "x" }, positionals: ["a"], rest: ["b", "c"] });
    await probe("--loud");
    expect(seen?.values).toEqual({ loud: true });
  });

  // @covers sta-2883:FR-007
  it("writes the body's output byte for byte and keeps its exit code", async () => {
    const result = await probe("--mode", "fail");
    expect(result.exitCode).toBe(3);
    expect(result.stdout).toBe("first line\nsecond line\n");
    expect(result.stderr).toBe("a note\n");
  });

  // @covers sta-2883:FR-007
  it("exits 2 with the body's usage for a CliUsageError", async () => {
    const result = await probe("--mode", "misuse");
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("that mode is not one");
    expect(result.stderr).toContain("Usage: stackra probe");
  });

  // @covers sta-2883:FR-005
  it("under --json, writes the document alone and the body's text to standard error", async () => {
    const result = await probe("--json", "--report");
    expect(result.json).toEqual({ ok: true, data: { reported: true } });
    expect(result.stderr).toContain("first line\nsecond line\n");
    expect(result.stderr).toContain("a note\n");
  });

  // @covers sta-2883:FR-005
  it("under --json, reads the output with toData when the body reports nothing", async () => {
    const result = await probe("--json", "--parse");
    expect((result.json as { data: unknown }).data).toEqual({
      lines: ["first line", "second line"],
    });
  });

  // @covers sta-2883:FR-005
  it("under --json, falls back to the exit code and the output as lines", async () => {
    const result = await probe("--json", "--mode", "fail");
    expect(result.exitCode).toBe(3);
    expect(result.json).toMatchObject({
      data: { exitCode: 3, output: ["first line", "second line"] },
    });
  });
});
