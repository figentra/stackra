/**
 * Stackra file contract:
 * Purpose: unit tests of `explainDocs`: a code's link is the `docs` of `stackra explain <code> --json` run through the
 *          given runner, asked once per code; an unknown code, a CLI without `explain`, a failed run or output without
 *          a document gives no link.
 * Boundary: test only; a fake runner.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2891; STA-2886.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { explainDocs } from "#node/functions/explain-docs.function";
import type { StackraRunner } from "#node/types/stackra-runner.type";

/** The reference entry `stackra explain` links for `shape_number_kind`. */
const DOCS = "https://docs.stackra.figentra.com/customers/error-codes#shapes-and-fields";

describe("explainDocs", () => {
  it("reads the link stackra explain gives, once per code", async () => {
    const run = vi.fn<StackraRunner>(async (args) =>
      args[1] === "shape_number_kind"
        ? {
            exitCode: 0,
            output: `${JSON.stringify({ ok: true, data: { code: "shape_number_kind", docs: DOCS } })}\n`,
          }
        : { exitCode: 2, output: '{"ok":false,"error":{"code":"usage","message":"unknown"}}\n' },
    );
    const docs = explainDocs(run);
    await expect(docs("shape_number_kind")).resolves.toBe(DOCS);
    await expect(docs("shape_number_kind")).resolves.toBe(DOCS);
    await expect(docs("TS2322")).resolves.toBeUndefined();
    expect(run.mock.calls).toEqual([
      [["explain", "shape_number_kind", "--json"]],
      [["explain", "TS2322", "--json"]],
    ]);
  });

  it("gives no link when the run fails, throws or prints no document", async () => {
    const outputs: Record<string, { exitCode: number; output: string }> = {
      plain: { exitCode: 0, output: "shape_number_kind · gen\nDocs   x\n" },
      broken: { exitCode: 0, output: "{not json\n" },
      empty: { exitCode: 0, output: '{"ok":true,"data":{"docs":""}}\n' },
    };
    const docs = explainDocs(async (args) => {
      const outcome = outputs[args[1] ?? ""];
      if (outcome === undefined) throw new Error("no stackra on PATH");
      return outcome;
    });
    for (const code of ["plain", "broken", "empty", "thrown"])
      await expect(docs(code), code).resolves.toBeUndefined();
  });
});
