/**
 * Stackra file contract:
 * Purpose: unit tests of `oasdiffBreaks` against a stand-in `oasdiff` script: it is started as
 *          `breaking base.json next.json --format json` beside the two documents it wrote, its JSON report becomes
 *          `ContractBreak`s (an empty or `null` report is none), and a missing binary, a failed run or output that is
 *          not the report is an error, never an empty result. The real binary is the contract tier's
 *          `oasdiff-breaks.contract.test.ts`.
 * Boundary: test only; writes the stand-in script under the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (decision 4); STA-2837.
 */
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { OpenApiDocument } from "@stackra/gen";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { oasdiffBreaks } from "#node/contract/functions/oasdiff-breaks.function";

const document = (title: string): OpenApiDocument =>
  ({
    $comment: "fixture",
    openapi: "3.1.0",
    info: { title, version: "1.0.0", "x-stackra-member": title },
    paths: {},
    components: { schemas: {}, responses: {} },
  }) as OpenApiDocument;

let folder: string;

beforeEach(() => {
  folder = mkdtempSync(join(tmpdir(), "stackra-fake-oasdiff-"));
});

afterEach(() => {
  rmSync(folder, { recursive: true, force: true });
});

/** A stand-in `oasdiff` that records its arguments and both documents' titles, then prints `stdout` and exits `code`. */
const fake = (stdout: string, code = 0, stderr = ""): string => {
  const bin = join(folder, "oasdiff");
  writeFileSync(
    bin,
    [
      "#!/usr/bin/env node",
      'const { readFileSync, writeFileSync } = require("node:fs");',
      "const args = process.argv.slice(2);",
      "const titles = args.slice(1, 3).map((file) => JSON.parse(readFileSync(file, 'utf8')).info.title);",
      `writeFileSync(${JSON.stringify(join(folder, "call.json"))}, JSON.stringify({ args, titles }));`,
      `process.stdout.write(${JSON.stringify(stdout)});`,
      `process.stderr.write(${JSON.stringify(stderr)});`,
      `process.exit(${code});`,
    ].join("\n"),
  );
  chmodSync(bin, 0o755);
  return bin;
};

describe("oasdiffBreaks", () => {
  it("starts oasdiff breaking on the two documents and maps its JSON report", async () => {
    const report = [
      {
        id: "api-path-removed-without-deprecation",
        text: "API path removed without deprecation",
        level: 3,
        operation: "POST",
        operationId: "billing_invoice_void",
        path: "/app/invoices/{invoiceId}/void",
        section: "paths",
      },
      {
        id: "response-optional-property-removed",
        text: "removed",
        level: 2,
        operation: "GET",
        path: "/x",
      },
    ];
    const breaks = await oasdiffBreaks(
      document("before"),
      document("after"),
      fake(JSON.stringify(report)),
    );
    expect(breaks).toEqual([
      {
        id: "api-path-removed-without-deprecation",
        level: 3,
        operation: "POST",
        path: "/app/invoices/{invoiceId}/void",
        text: "API path removed without deprecation",
      },
      {
        id: "response-optional-property-removed",
        level: 2,
        operation: "GET",
        path: "/x",
        text: "removed",
      },
    ]);
    expect(JSON.parse(readFileSync(join(folder, "call.json"), "utf8"))).toEqual({
      args: ["breaking", "base.json", "next.json", "--format", "json"],
      titles: ["before", "after"],
    });
  });

  it("reads an empty or null report as no break", async () => {
    expect(await oasdiffBreaks(document("a"), document("b"), fake("[]\n"))).toEqual([]);
    expect(await oasdiffBreaks(document("a"), document("b"), fake(""))).toEqual([]);
    expect(await oasdiffBreaks(document("a"), document("b"), fake("null"))).toEqual([]);
  });

  it("fails when oasdiff fails or prints something that is not its report", async () => {
    await expect(
      oasdiffBreaks(
        document("a"),
        document("b"),
        fake("", 1, "Error: failed to load base spec\nmore"),
      ),
    ).rejects.toThrow(/breaking failed \(exit 1\): Error: failed to load base spec$/);
    await expect(oasdiffBreaks(document("a"), document("b"), fake("No changes"))).rejects.toThrow(
      "printed no JSON report: No changes",
    );
    await expect(oasdiffBreaks(document("a"), document("b"), fake("{}"))).rejects.toThrow(
      "printed object, not a list of changes",
    );
  });

  it("names the pin to install when the binary is missing", async () => {
    await expect(
      oasdiffBreaks(document("a"), document("b"), join(folder, "missing-oasdiff")),
    ).rejects.toThrow("is not installed: run `mise install github:oasdiff/oasdiff@1.40.0`");
  });
});
