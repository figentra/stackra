/**
 * Stackra file contract:
 * Purpose: unit tests of `adrStatusOf` and `descriptionOf`: the leading status word of the template's vocabulary in
 *          any case, the superseding number, separators after the word, and undefined for a text with no status; the
 *          frontmatter description with or without quotes, and undefined outside the frontmatter.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: STA-2851; ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { adrStatusOf } from "#node/functions/adr-status-of.function";
import { descriptionOf } from "#node/functions/description-of.function";

describe("adrStatusOf", () => {
  it("reads the leading status and the superseding number", () => {
    expect(adrStatusOf("Accepted · 2026-10-28")).toEqual({ status: "accepted" });
    expect(adrStatusOf("Proposed; amended 2026-10-24 (STA-469)")).toEqual({ status: "proposed" });
    expect(adrStatusOf("Accepted, amended by 0282")).toEqual({ status: "accepted" });
    expect(adrStatusOf("Superseded by 0510, amended by 0198, 0282")).toEqual({
      status: "superseded",
      by: "0510",
    });
    expect(adrStatusOf("superseded")).toEqual({ status: "superseded" });
    expect(adrStatusOf("Deferred · 2026-10-22")).toEqual({ status: "deferred" });
  });

  it("is undefined for a text that opens with no status", () => {
    expect(adrStatusOf("Draft")).toBeUndefined();
    expect(adrStatusOf("")).toBeUndefined();
    expect(adrStatusOf("Acceptedly")).toBeUndefined();
  });
});

describe("descriptionOf", () => {
  it("reads the frontmatter description with or without quotes", () => {
    expect(descriptionOf('---\ntitle: "A"\ndescription: "Accepted · 2026-10-19"\n---\n')).toBe(
      "Accepted · 2026-10-19",
    );
    expect(descriptionOf("---\ndescription: Proposed\n---\n")).toBe("Proposed");
  });

  it("is undefined without frontmatter or a description in it", () => {
    expect(descriptionOf("description: Accepted\n")).toBeUndefined();
    expect(descriptionOf('---\ntitle: "A"\n---\ndescription: Accepted\n')).toBeUndefined();
  });
});
