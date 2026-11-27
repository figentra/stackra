/**
 * Stackra file contract:
 * Purpose: unit tests of `toolResult`: a command's document becomes `{ ok, diagnostics, data?, error? }` with the data's
 *          diagnostics lifted out of it and linked to their code's docs where they have none; the command's error is one
 *          diagnostic of the tool's phase with its code, why, fix and docs; `ok` and `isError` follow the exit code; the
 *          text content is the same JSON.
 * Boundary: test only; a fake docs lookup.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2886.
 */
import type { Diagnostic } from "@stackra/console/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { toolResult } from "#node/functions/tool-result.function";

/** The reference entry for gen's shapes group. */
const DOCS = "https://docs.stackra.figentra.com/customers/error-codes#shapes-and-fields";

describe("toolResult", () => {
  it("lifts the data's diagnostics to the top and links each code once", async () => {
    const gen: Diagnostic = {
      phase: "gen",
      code: "shape_number_kind",
      severity: "error",
      file: "src/a.ts",
      message: "bad",
    };
    const printed: Diagnostic = { ...gen, file: "src/b.ts", docsUrl: "https://example.test/own" };
    const plain: Diagnostic = { phase: "test", severity: "error", file: "a.test.ts", message: "x" };
    const docs = vi.fn(async (code: string) => (code === "shape_number_kind" ? DOCS : undefined));
    const result = await toolResult(
      "gen",
      {
        ok: false,
        data: { command: "stackra gen", errors: 3, diagnostics: [gen, printed, plain] },
      },
      1,
      docs,
    );
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toEqual({
      ok: false,
      diagnostics: [{ ...gen, docsUrl: DOCS }, printed, plain],
      data: { command: "stackra gen", errors: 3 },
    });
    expect(docs.mock.calls).toEqual([["shape_number_kind"]]);
    expect(JSON.parse(result.content[0]?.text ?? "")).toEqual(result.structuredContent);
  });

  it("makes the command's error one diagnostic of the tool's phase", async () => {
    const error = {
      code: "unknown_member",
      message: "no member billing",
      why: "the members are commerce and web",
      fix: "name one of them",
      docs: "https://docs.stackra.figentra.com/customers/troubleshooting",
    };
    const result = await toolResult("test", { ok: false, error }, 2);
    expect(result).toMatchObject({
      isError: true,
      structuredContent: {
        ok: false,
        error,
        diagnostics: [
          {
            phase: "test",
            code: "unknown_member",
            severity: "error",
            message: "no member billing: the members are commerce and web",
            fix: "name one of them",
            docsUrl: "https://docs.stackra.figentra.com/customers/troubleshooting",
          },
        ],
      },
    });
    expect(result.structuredContent).not.toHaveProperty("data");
  });

  it("answers a passing tool with no findings as ok with an empty list, its data unchanged", async () => {
    const result = await toolResult("app_info", { ok: true, data: { name: "acme" } }, 0);
    expect(result).toMatchObject({
      isError: false,
      structuredContent: { ok: true, diagnostics: [], data: { name: "acme" } },
    });
    const listed = await toolResult("manifest", { ok: true, data: [{ member: "web" }] }, 0);
    expect(listed.structuredContent).toEqual({
      ok: true,
      diagnostics: [],
      data: [{ member: "web" }],
    });
    expect((await toolResult("x", { ok: true, data: null }, 0)).structuredContent).toEqual({
      ok: true,
      diagnostics: [],
      data: null,
    });
  });
});
