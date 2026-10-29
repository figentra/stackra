/**
 * Stackra file contract:
 * Purpose: unit tests of `traitSubscribers`: `TreeSubscriber` when an own model or a declared package's model has
 *          `HasTree`, nothing otherwise.
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); ADR 0096 (decision 4); ADR 0321.
 */
import { describe, expect, it } from "@stackra/testing";

import { traitSubscribers } from "#core/functions/trait-subscribers.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import type { MemberIR } from "#core/types/member-ir.type";

/** `COMMERCE_IR` with `trait` added to each of its own models. */
function withTrait(trait: string): MemberIR {
  return {
    ...COMMERCE_IR,
    classes: COMMERCE_IR.classes.map((declared) =>
      declared.kind === "model"
        ? { ...declared, traits: [...declared.traits, { name: trait, args: [] }] }
        : declared,
    ),
  };
}

describe("traitSubscribers", () => {
  it("adds nothing when no model has a subscriber trait", () => {
    expect(traitSubscribers(COMMERCE_IR)).toEqual([]);
  });

  it("adds the TreeSubscriber for an own HasTree model", () => {
    expect(traitSubscribers(withTrait("HasTree"))).toEqual(["TreeSubscriber"]);
  });

  it("adds the TreeSubscriber for a declared package's HasTree model", () => {
    const manifest = { models: [{ key: "catalog.category", traits: ["HasTree"] }] } as never;
    const ir: MemberIR = {
      ...COMMERCE_IR,
      dependencies: [{ package: "@acme/catalog", manifest }],
    };
    expect(traitSubscribers(ir)).toEqual(["TreeSubscriber"]);
  });
});
