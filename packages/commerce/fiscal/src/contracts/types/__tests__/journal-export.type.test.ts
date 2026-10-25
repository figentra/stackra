/**
 * Stackra file contract:
 * Purpose: type tests of `JournalExport`: text and base64 exports type-check, another encoding does not.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import type { JournalExport } from "#contracts/types/journal-export.type";

describe("JournalExport", () => {
  it("takes utf-8 and base64 and refuses another encoding", () => {
    const text: JournalExport = {
      fileName: "a.jsonl",
      contentType: "application/jsonl",
      encoding: "utf-8",
      content: "",
    };
    // @ts-expect-error -- only utf-8 or base64
    const other: JournalExport = { ...text, encoding: "latin1" };
    expect([text.encoding, other.encoding]).toEqual(["utf-8", "latin1"]);
  });
});
