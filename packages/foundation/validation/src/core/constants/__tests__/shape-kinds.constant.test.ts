/**
 * Stackra file contract:
 * Purpose: unit tests of `SHAPE_KINDS`: frozen snake_case codes covering the field-carrying kinds the template
 *          decorates (schemas, models, refusals, settings, blocks, events, changes), and a field decorator accepts a
 *          class of each.
 * Boundary: test only; the kinds are registered here with stand-in bases, as each kind package does with its own.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 6 and
 *                     16); ADR 0231.
 */
import { registerKind } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { SHAPE_KINDS } from "#core/constants/shape-kinds.constant";
import { Int } from "#core/decorators/int.decorator";

describe("SHAPE_KINDS", () => {
  it("is a frozen list of snake_case codes", () => {
    expect(Object.isFrozen(SHAPE_KINDS)).toBe(true);
    for (const code of SHAPE_KINDS) expect(code).toMatch(/^[a-z]+(_[a-z]+)*$/);
    expect(new Set(SHAPE_KINDS).size).toBe(SHAPE_KINDS.length);
  });

  it("covers the kinds the template puts field decorators on", () => {
    expect(SHAPE_KINDS).toEqual(
      expect.arrayContaining([
        "block",
        "change",
        "domain_event",
        "integration_event",
        "model",
        "refusal",
        "schema",
        "settings",
      ]),
    );
  });

  it.each(SHAPE_KINDS)("lets a field decorator mark a class of kind %s", (kind) => {
    abstract class KindBase {}
    registerKind(KindBase, kind);
    expect(() => {
      class Shaped extends KindBase {
        @Int({ min: 0 })
        count = 0;
      }
      return Shaped;
    }).not.toThrow();
  });
});
