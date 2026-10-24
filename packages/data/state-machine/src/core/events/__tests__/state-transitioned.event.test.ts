/**
 * Stackra file contract:
 * Purpose: unit tests of `StateTransitioned`: a `domain_event` that `create` builds frozen from the schema this package
 *          ships, with an optional record id, refusing an empty name.
 * Boundary: test only; relies on the registration the event's module makes at load, with no generated file.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0161 (decision 4); ADR 0294 (decision 26).
 */
import { kindOf } from "@stackra/container";
import { DomainEvent } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";

import { StateTransitioned } from "#core/events/state-transitioned.event";

const values = {
  machine: "OrderStateMachine",
  transition: "cancel",
  field: "status",
  from: "pending_payment",
  to: "cancelled",
};

describe("StateTransitioned", () => {
  it("is a domain event built frozen from its shipped schema", () => {
    const event = StateTransitioned.create({ ...values, recordId: "ord_1" });
    expect(kindOf(StateTransitioned)?.kind).toBe("domain_event");
    expect(event).toBeInstanceOf(DomainEvent);
    expect(event).toEqual({ ...values, recordId: "ord_1" });
    expect(Object.isFrozen(event)).toBe(true);
  });

  it("takes no record id for a model without a string id", () => {
    expect(StateTransitioned.create(values)).not.toHaveProperty("recordId");
  });

  it("refuses an empty name", () => {
    expect(() => StateTransitioned.create({ ...values, transition: "" })).toThrow();
  });
});
