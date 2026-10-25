/**
 * Stackra file contract:
 * Purpose: unit tests of `fillPlaceholders`: wording and values as separate parts, spaces inside braces, and a refusal
 *          for a missing or unprintable value.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { DocumentValueError } from "#core/errors/document-value.error";
import { fillPlaceholders } from "#core/functions/fill-placeholders.function";

describe("fillPlaceholders", () => {
  it("splits wording and values", () => {
    expect(
      fillPlaceholders(
        "Dear {{ client.name }}, ref {{ref}}.",
        { client: { name: "Sara" }, ref: "A-1" },
        "en",
      ),
    ).toEqual([
      { text: "Dear ", isValue: false },
      { text: "Sara", isValue: true },
      { text: ", ref ", isValue: false },
      { text: "A-1", isValue: true },
      { text: ".", isValue: false },
    ]);
    expect(fillPlaceholders("plain", {}, "en")).toEqual([{ text: "plain", isValue: false }]);
  });

  it("refuses a missing or unprintable value with its path", () => {
    let caught: unknown;
    try {
      fillPlaceholders("{{a.b}}", { a: {} }, "en");
    } catch (error) {
      caught = error;
    }
    expect(isRefusal(caught, DocumentValueError)).toBe(true);
    expect((caught as DocumentValueError).path).toBe("a.b");
    expect(() => fillPlaceholders("{{a}}", { a: { b: 1 } }, "en")).toThrow(DocumentValueError);
  });
});
