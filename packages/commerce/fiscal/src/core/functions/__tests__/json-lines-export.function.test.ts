/**
 * Stackra file contract:
 * Purpose: unit tests of `jsonLinesExport`: one JSON line per record with the chain fields, and an empty file for none.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { jsonLinesExport } from "#core/functions/json-lines-export.function";
import { fiscalRecord } from "#testing/fiscal-record.fixture";

describe("jsonLinesExport", () => {
  it("writes one line per record", () => {
    const second = fiscalRecord({
      sequence: 2,
      documentId: "doc_2",
      previousHash: "hash-1",
      hash: "hash-2",
    });
    const file = jsonLinesExport([fiscalRecord(), second], "u.jsonl");
    const lines = file.content
      .trimEnd()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect([file.fileName, file.contentType, file.encoding]).toEqual([
      "u.jsonl",
      "application/jsonl",
      "utf-8",
    ]);
    expect(lines.map((line) => [line.sequence, line.previousHash, line.hash])).toEqual([
      [1, null, "hash-1"],
      [2, "hash-1", "hash-2"],
    ]);
    expect(lines[0].sealedAt).toBe("2026-03-01T09:30:00.000Z");
  });

  it("is empty for no records", () => {
    expect(jsonLinesExport([], "u.jsonl").content).toBe("");
  });
});
