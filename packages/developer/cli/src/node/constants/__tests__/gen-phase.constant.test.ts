/**
 * Stackra file contract:
 * Purpose: unit tests of `GEN_PHASE`: it runs `stackra gen --check` in-process at the root and turns gen's own output into findings,
 *          one per refusal (with its rule, path, line and column) and one per stale file (fixable); a clean check has none; a non-zero
 *          exit with no line it can read is one `exit` finding and the output goes to stderr; `--fix` runs `gen` first and the
 *          findings come only from the check after it.
 * Boundary: test only; `GEN_COMMAND` is a fake that prints what gen prints, no member is read.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 10 and 26); ADR 0295.
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { GEN_COMMAND } from "#node/constants/gen-command.constant";
import { GEN_PHASE } from "#node/constants/gen-phase.constant";
import type { CliContext } from "#node/types/cli-context.type";

vi.mock("#node/constants/gen-command.constant", () => ({ GEN_COMMAND: { run: vi.fn() } }));

/** What gen does on one call: what it prints and the code it returns. */
type Call = { readonly print?: string; readonly code: number };

/** Queues the answers of the successive `gen` calls. */
const answer = (...calls: Call[]): void => {
  for (const call of calls)
    vi.mocked(GEN_COMMAND.run).mockImplementationOnce(async (context: CliContext) => {
      if (call.print !== undefined) context.io.out(call.print);
      return call.code;
    });
};

const run = async (fix = false) => {
  const stderr: string[] = [];
  const result = await GEN_PHASE.run({
    root: "/repo",
    fix,
    io: { out: () => undefined, err: (chunk: string) => stderr.push(chunk), inherit: false },
  } as never);
  return { findings: result.findings, stderr: stderr.join("") };
};

beforeEach(() => {
  vi.mocked(GEN_COMMAND.run).mockReset();
});

describe("GEN_PHASE", () => {
  it("runs gen --check at the root, in-process, and has no finding when it is clean", async () => {
    answer({ print: "gen: ok\n", code: 0 });
    const { findings } = await run();

    expect(findings).toEqual([]);
    expect(GEN_COMMAND.run).toHaveBeenCalledTimes(1);
    expect(GEN_COMMAND.run).toHaveBeenCalledWith(
      expect.objectContaining({ cwd: "/repo", values: { check: true }, positionals: [], rest: [] }),
    );
  });

  it("reports a refusal with its rule, path, line and column, and one without a position", async () => {
    answer({
      print:
        "services/billing/src/invoice.module.ts:4:3 error shape_number_kind amount: a number needs a kind\n" +
        "services/billing error empty_module billing: no declarations\n",
      code: 1,
    });
    const { findings, stderr } = await run();

    expect(findings).toHaveLength(2);
    expect(findings[0]).toMatchObject({
      phase: "gen",
      tool: "gen",
      rule: "shape_number_kind",
      path: "services/billing/src/invoice.module.ts",
      line: 4,
      column: 3,
      message: "amount: a number needs a kind",
      severity: "error",
      fixable: false,
    });
    expect(findings[1]).toMatchObject({
      rule: "empty_module",
      path: "services/billing",
      line: null,
      column: null,
    });
    // Readable output is findings, not a raw dump.
    expect(stderr).toBe("");
  });

  it("reports a stale generated file as one fixable finding that says how to fix it", async () => {
    answer({ print: "stale: services/billing/.stackra/gen/schema.json\n", code: 1 });
    const { findings } = await run();

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      rule: "stale",
      path: "services/billing/.stackra/gen/schema.json",
      fixable: true,
    });
    expect(findings[0]?.message).toContain("stackra gen");
    expect(findings[0]?.message).toContain("stackra check --fix");
  });

  it("makes one `exit` finding of a failure it cannot read, and writes gen's output to stderr", async () => {
    answer({ print: "starting\nboom: could not load the workspace\n", code: 2 });
    const { findings, stderr } = await run();

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ rule: "exit", path: "." });
    expect(findings[0]?.message).toBe("gen exited 2: boom: could not load the workspace");
    expect(stderr).toBe("starting\nboom: could not load the workspace\n");
  });

  it("does not add an `exit` finding when a failure is already explained by findings", async () => {
    answer({ print: "services/x error empty_module x: nothing\n", code: 1 });
    const { findings, stderr } = await run();
    expect(findings.map((finding) => finding.rule)).toEqual(["empty_module"]);
    expect(stderr).toBe("");
  });

  it("with --fix runs gen first, then checks, and reports only what the check finds", async () => {
    answer(
      { print: "stale: a.ts\nservices/old error empty_module old: from the write\n", code: 1 },
      { print: "stale: b.ts\n", code: 1 },
    );
    const { findings } = await run(true);

    expect(vi.mocked(GEN_COMMAND.run).mock.calls.map(([context]) => context.values)).toEqual([
      { check: false },
      { check: true },
    ]);
    expect(findings.map((finding) => finding.path)).toEqual(["b.ts"]);
  });
});
