/**
 * Stackra file contract:
 * Purpose: unit tests of `AuditEntryRecorded`: an integration event named `audit_entry.recorded` at version 1, with
 *          its schema registered, built with `create` from its fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212 (decision 4).
 */
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { AuditEntryRecorded } from "#core/events/audit-entry-recorded.event";

describe("AuditEntryRecorded", () => {
  it("is an integration event built from its fields", () => {
    expect(kindOf(AuditEntryRecorded)?.kind).toBe("integration_event");
    expect(kindOf(AuditEntryRecorded)?.options).toMatchObject({
      name: "audit_entry.recorded",
      version: 1,
    });
    expect(schemaOf(AuditEntryRecorded)).toBeDefined();
    const event = AuditEntryRecorded.create({
      callId: "c1",
      key: "orders.order.create@1",
      effects: [],
      actor: { kind: ActorKind.User, id: "usr_1" },
      outcome: "ok",
      fields: { quantity: 1 },
    });
    expect(event).toMatchObject({ key: "orders.order.create@1", outcome: "ok" });
  });
});
