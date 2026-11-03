/**
 * Stackra file contract:
 * Purpose: proves `toolsOf` offers only `tool` commands, under MCP-safe names with a JSON Schema derived from their
 *          fields and their read-only hint; that one command returns equal data as a CLI `--json` run, a tool call and
 *          a test-harness run; that a tool call is checked like a typed line (no value reads as a flag, an unknown
 *          key is refused); and that a failing tool call carries the command's error document.
 * Boundary: unit test in-process.
 * Runtime: node
 * Governing contract: STA-1966 spec FR-020, FR-027, AC-006 and P-008/P-010; ADR 0022 (test placement).
 */
// @covers sta-1966:FR-020 sta-1966:FR-027 sta-1966:AC-006
import { Int, List } from "@stackra/validation";

import { Command } from "#core/bases/command.base";
import { Argument } from "#core/decorators/argument.decorator";
import { Option } from "#core/decorators/option.decorator";
import { CommandError } from "#core/errors/command-error.error";
import { toolsOf } from "#core/functions/tools-of.function";
import type { CommandIo } from "#core/types/command-io.type";
import { runCommandForTest } from "#testing/functions/run-command-for-test.function";

/** Reports the state of a spec; a read-only tool. */
class SpecStatusCommand extends Command({
  name: "spec:status",
  description: "Report a spec",
  tool: { readOnly: true },
}) {
  @Argument({ description: "The spec folder" })
  spec!: string;

  @Option({
    description: "The view",
    choices: ["short", "long"],
  })
  view = "short";

  @Option
  @Int({ min: 1 })
  depth = 1;

  @Option
  @List
  tags: string[] = [];

  @Option
  verbose2 = false;

  handle(io: CommandIo) {
    return { spec: this.spec, view: this.view, depth: this.depth, tags: this.tags, cwd: io.cwd };
  }
}

/** Fails with a fix; a writing tool. */
class SyncCommand extends Command({
  name: "sync",
  description: "Sync",
  tool: true,
}) {
  handle(): never {
    throw new CommandError("Nothing to sync", { fix: "fflow init" });
  }
}

/** Not a tool. */
class PrivateCommand extends Command({
  name: "private",
  description: "Not a tool",
}) {
  handle() {
    return 0;
  }
}

const CONFIG = {
  name: "acme",
  version: "1.0.0",
  commands: [SpecStatusCommand, SyncCommand, PrivateCommand],
};
const tools = toolsOf(CONFIG, { cwd: "/work" });
const tool = (name: string) => tools.find((candidate) => candidate.name === name);

describe("toolsOf", () => {
  it("offers only tool commands, under MCP-safe names, with their read-only hint", () => {
    expect(tools.map((candidate) => [candidate.name, candidate.readOnly])).toEqual([
      ["spec_status", true],
      ["sync", false],
    ]);
  });

  it("derives the input schema from the fields", () => {
    expect(tool("spec_status")?.inputSchema).toEqual({
      type: "object",
      properties: {
        spec: { type: "string", description: "The spec folder" },
        view: {
          type: "string",
          enum: ["short", "long"],
          description: "The view",
          default: "short",
        },
        depth: { type: "integer", minimum: 1, default: 1 },
        tags: { type: "array", items: { type: "string" }, default: [] },
        verbose2: { type: "boolean", default: false },
      },
      required: ["spec"],
      additionalProperties: false,
    });
  });

  it("returns the same data as a --json run and a harness run", async () => {
    const input = { spec: "sta-1-x", view: "long", depth: 2, tags: ["a", "b"] };
    const argv = [
      "spec:status",
      "sta-1-x",
      "--view",
      "long",
      "--depth",
      "2",
      "--tags",
      "a",
      "--tags",
      "b",
    ];
    const called = await tool("spec_status")?.invoke(input);
    const cli = await runCommandForTest(CONFIG, [...argv, "--json"], { cwd: "/work" });
    expect(called?.exitCode).toBe(0);
    expect(called?.document).toEqual(cli.json);
    expect(called?.document).toEqual({
      ok: true,
      data: { spec: "sta-1-x", view: "long", depth: 2, tags: ["a", "b"], cwd: "/work" },
    });
  });

  it("keeps a value that starts with a dash a value, and refuses an unknown key or a bad value", async () => {
    const dashed = await tool("spec_status")?.invoke({ spec: "--help", tags: ["--json"] });
    expect(dashed?.document).toMatchObject({
      ok: true,
      data: { spec: "--help", tags: ["--json"] },
    });
    expect(await tool("spec_status")?.invoke({ spec: "x", bogus: 1 })).toMatchObject({
      exitCode: 2,
      document: { ok: false, error: { message: 'spec:status has no input "bogus"' } },
    });
    expect(await tool("spec_status")?.invoke({ spec: "x", view: "wide" })).toMatchObject({
      exitCode: 2,
    });
  });

  it("carries a failing command's error document", async () => {
    expect(await tool("sync")?.invoke({})).toEqual({
      exitCode: 1,
      document: {
        ok: false,
        error: { code: "command", message: "Nothing to sync", fix: "fflow init" },
      },
    });
  });
});
