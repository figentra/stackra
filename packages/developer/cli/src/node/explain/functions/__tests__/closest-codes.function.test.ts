/**
 * Stackra file contract:
 * Purpose: unit tests of `closestCodes`: codes containing what was typed come first (shortest first), then codes within
 *          three edits, nearest first; case and `-` / `_` are ignored; at most five; nothing for an empty or distant
 *          word.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2891.
 */
import { describe, expect, it } from "@stackra/testing";

import { closestCodes } from "#node/explain/functions/closest-codes.function";

const CODES = [
  "shape_number_kind",
  "shape_unknown_type",
  "shape_rule_not_constant",
  "kind_path",
  "kind_class_name",
  "json-configs",
];

describe("closestCodes", () => {
  it("puts codes containing the word first, then the nearest", () => {
    expect(closestCodes("shape_numbr_kind", CODES)).toEqual(["shape_number_kind"]);
    expect(closestCodes("kind", CODES)).toEqual([
      "kind_path",
      "kind_class_name",
      "shape_number_kind",
    ]);
  });

  it("ignores case and reads - as _", () => {
    expect(closestCodes("SHAPE-NUMBER-KIN", CODES)).toEqual(["shape_number_kind"]);
    expect(closestCodes("json_config", CODES)).toEqual(["json-configs"]);
  });

  it("reads a check finding's <tool>/<rule> as its rule", () => {
    expect(closestCodes("repo-checks/json-config", CODES)).toEqual(["json-configs"]);
    expect(closestCodes("oxlint/stackra/kind_pth", CODES)).toEqual(["kind_path"]);
    expect(closestCodes("repo-checks/", CODES)).toEqual([]);
  });

  it("suggests at most five, and nothing for an empty or distant word", () => {
    expect(closestCodes("_", CODES)).toHaveLength(5);
    expect(closestCodes("  ", CODES)).toEqual([]);
    expect(closestCodes("zzzzzzzzzz", CODES)).toEqual([]);
  });
});
