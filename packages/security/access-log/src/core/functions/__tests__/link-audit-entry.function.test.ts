/**
 * Stackra file contract:
 * Purpose: unit tests of `linkAuditEntry`: it flattens the pipeline's `AuditEntry` (absent optional fields as null),
 *          starts a chain after 64 zeros and links the next entry after the head.
 * Boundary: test only; pure Web Crypto, no store.
 * Runtime: isomorphic (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212 (decision 3); ADR 0465 (decision 4).
 */
import { CallOriginKind, Effect } from "@stackra/actions/contracts";
import type { AuditEntry } from "@stackra/actions/contracts";
import { ActorKind, ApiArea, Realm } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { linkAuditEntry } from "#core/functions/link-audit-entry.function";

/** A refused call with every optional descriptor field. */
const FULL: AuditEntry = {
  call: {
    callId: "call_1",
    type: class {},
    kind: "action",
    key: "payments.payment.refund@1",
    permission: "payments.payment.refund",
    risk: "L3",
    effects: [Effect.Financial],
    actor: { kind: ActorKind.User, id: "usr_1", realm: Realm.Staff, scopeId: "scp_acme" },
    scopeId: "scp_acme",
    scope: { id: "scp_store", path: "platform.acme.store" },
    area: ApiArea.App,
    origin: { kind: CallOriginKind.ApiKey, id: "key_1" },
  },
  at: new Date("2026-10-28T09:00:00Z"),
  outcome: "refused",
  code: "refund_window_closed",
  fields: { orderId: "ord_1" },
};

/** An ok call with no optional field. */
const BARE: AuditEntry = {
  call: {
    callId: "call_2",
    type: class {},
    kind: "action",
    key: "orders.order.create@1",
    actor: { kind: ActorKind.Service, id: "svc_1", scopeId: "scp_acme" },
    area: ApiArea.App,
  },
  at: new Date("2026-10-28T09:01:00Z"),
  outcome: "ok",
  fields: {},
};

describe("linkAuditEntry", () => {
  it("flattens a full entry and starts a chain", async () => {
    const link = await linkAuditEntry(FULL);
    expect(link).toMatchObject({
      callId: "call_1",
      key: "payments.payment.refund@1",
      permission: "payments.payment.refund",
      risk: "L3",
      effects: ["financial"],
      scopeId: "scp_store",
      scopePath: "platform.acme.store",
      originKind: CallOriginKind.ApiKey,
      originId: "key_1",
      outcome: "refused",
      code: "refund_window_closed",
      fields: { orderId: "ord_1" },
      sequence: 1,
      previousHash: "0".repeat(64),
    });
    expect(link.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("stores absent optional fields as null and links after the head", async () => {
    const first = await linkAuditEntry(FULL);
    const second = await linkAuditEntry(BARE, first);
    expect(second).toMatchObject({
      permission: null,
      risk: null,
      effects: [],
      scopeId: null,
      scopePath: null,
      originKind: null,
      originId: null,
      code: null,
      sequence: 2,
      previousHash: first.hash,
    });
    expect(second.hash).not.toBe(first.hash);
  });
});
