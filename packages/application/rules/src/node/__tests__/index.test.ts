/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: it exports the model and the service, nothing else, none of
 *          the `.` entry's symbols, and types the revision it reads.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15: one symbol, one entry).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as core from "#core/index";
import type { Condition } from "#core/index";
import * as node from "#node/index";
import type { RuleSetRevision } from "#node/index";

describe("@stackra/rules/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "ConditionField",
      "ConditionFieldService",
      "RuleSet",
      "RuleSetService",
    ]);
  });

  it("shares no symbol with the `.` entry", () => {
    expect(Object.keys(node).filter((name) => name in core)).toEqual([]);
  });

  it("types a revision", () => {
    expectTypeOf<RuleSetRevision["condition"]>().toEqualTypeOf<Condition>();
    expectTypeOf<RuleSetRevision["publishedAt"]>().toEqualTypeOf<Date | null>();
  });
});
