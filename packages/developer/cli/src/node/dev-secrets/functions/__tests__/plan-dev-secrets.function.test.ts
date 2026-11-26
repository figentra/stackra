/**
 * Stackra file contract:
 * Purpose: unit tests of `planDevSecrets`: a first init generates every name, a later one adds only the missing names
 *          and is refused when none is missing, `--rotate` regenerates the generated names and keeps hand-set ones,
 *          and `--from` values are copied instead of generated.
 * Boundary: test only; the random source is a counter.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0525 (amendment of 2026-11-10); STA-2679.
 */
import { describe, expect, it } from "@stackra/testing";

import { planDevSecrets } from "#node/dev-secrets/functions/plan-dev-secrets.function";

const counter = (): (() => string) => {
  let next = 0;
  return () => `generated-${(next += 1)}`;
};

describe("planDevSecrets", () => {
  it("generates every name on a first init", () => {
    expect(planDevSecrets({ generate: ["A", "B"], random: counter() })).toEqual({
      refused: false,
      values: { A: "generated-1", B: "generated-2" },
      generated: ["A", "B"],
      copied: [],
    });
  });

  it("adds only the missing names to an existing file and keeps names set by hand", () => {
    const plan = planDevSecrets({
      generate: ["A", "B"],
      existing: { A: "kept", DATABASE_URL: "set-by-hand" },
      random: counter(),
    });
    expect(plan).toEqual({
      refused: false,
      values: { A: "kept", DATABASE_URL: "set-by-hand", B: "generated-1" },
      generated: ["B"],
      copied: [],
    });
  });

  it("refuses when nothing is missing", () => {
    expect(planDevSecrets({ generate: ["A"], existing: { A: "kept" }, random: counter() })).toEqual(
      { refused: true },
    );
  });

  it("regenerates every generated name on --rotate and keeps the names set by hand", () => {
    const plan = planDevSecrets({
      generate: ["A"],
      existing: { A: "old", DATABASE_URL: "set-by-hand" },
      rotate: true,
      random: counter(),
    });
    expect(plan).toEqual({
      refused: false,
      values: { A: "generated-1", DATABASE_URL: "set-by-hand" },
      generated: ["A"],
      copied: [],
    });
  });

  it("copies --from values for matching names instead of generating them", () => {
    const plan = planDevSecrets({
      generate: ["A", "B"],
      from: { B: "from-the-other-repository", OTHER: "ignored" },
      random: counter(),
    });
    expect(plan).toEqual({
      refused: false,
      values: { A: "generated-1", B: "from-the-other-repository" },
      generated: ["A"],
      copied: ["B"],
    });
  });
});
