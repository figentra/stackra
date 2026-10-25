/**
 * Stackra file contract:
 * Purpose: unit tests of `RuleSetPublished`: a `domain_event` that `create` builds frozen from the schema this package
 *          ships, refusing a malformed rule set id and a revision below 1.
 * Boundary: test only; relies on the registration the event's module makes at load, with no generated file.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0331 (decision 5); ADR 0294 (decision 26).
 */
import { kindOf } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import { DomainEvent } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";

import { RuleSetPublished } from "#core/events/rule-set-published.event";

/** A valid payload. */
const values = {
  ruleSetId: "rset_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"rset">,
  consumer: "segments.segment",
  revision: 2,
};

describe("RuleSetPublished", () => {
  it("is a domain event built frozen from its shipped schema", () => {
    const event = RuleSetPublished.create(values);
    expect(kindOf(RuleSetPublished)?.kind).toBe("domain_event");
    expect(event).toBeInstanceOf(DomainEvent);
    expect(event).toEqual(values);
    expect(Object.isFrozen(event)).toBe(true);
  });

  it("refuses a malformed id and a revision below 1", () => {
    expect(() =>
      RuleSetPublished.create({ ...values, ruleSetId: "rs_1" as PublicId<"rset"> }),
    ).toThrow();
    expect(() => RuleSetPublished.create({ ...values, revision: 0 })).toThrow();
  });
});
