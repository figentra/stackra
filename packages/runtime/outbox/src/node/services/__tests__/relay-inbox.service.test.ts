/**
 * Stackra file contract:
 * Purpose: tests of `RelayInboxService`: an unverified request is refused with 401 and reaches no listener; a verified
 *          one is read as an envelope whose `producer` is the verified one, whatever the body says, and handed to the
 *          inbox, which answers 204 handled or already received; a bad body or an unknown event answers 422; a body
 *          over the limit 413; a method but POST 405; a listener's error propagates.
 * Boundary: test only; a scripted verifier and a recording inbox stand in for the real ones (the verifier's own table
 *           is in the driver's tests).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0511 (decisions 11, 13 and 18).
 */
import { Driver } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { InboxVerifier } from "#contracts/index";
import type { EventEnvelope, InboxVerdict } from "#contracts/index";
import { UnknownEventError } from "#core/errors/unknown-event.error";
import type { InboxService } from "#node/services/inbox.service";
import { RelayInboxService } from "#node/services/relay-inbox.service";

const NOON = new Date(Date.UTC(2026, 10, 2, 12));

const clock = { now: () => new Date(NOON) } as Clock;

const ENVELOPE = {
  id: "evt_1",
  type: "payments.payment.captured.v1",
  occurredAt: NOON.toISOString(),
  scope: { id: "scp_1", path: "platform.acme" },
  meta: { correlationId: "call-1" },
  data: { paymentId: "pay_1" },
  envelopeVersion: 1,
};

class ScriptedVerifier extends Driver(InboxVerifier) {
  verdict: InboxVerdict = { verified: true, producer: "payments", keyId: "pay-dev-1" };

  async verify(): Promise<InboxVerdict> {
    return this.verdict;
  }
}

/** An inbox that records what it receives, runs each id once, and throws what `failWith` holds. */
function inboxOf() {
  const received: EventEnvelope[] = [];
  const seen = new Set<string>();
  const state: { failWith?: Error } = {};
  const inbox = {
    async receive(envelope: EventEnvelope): Promise<boolean> {
      if (state.failWith !== undefined) throw state.failWith;
      if (seen.has(envelope.id)) return false;
      seen.add(envelope.id);
      received.push(envelope);
      return true;
    },
  } as unknown as InboxService;
  return { inbox, received, state };
}

/** A POST of `body` to the inbox route. */
function post(body: string): Request {
  return new Request("https://billing.test/events/inbox", { method: "POST", body });
}

describe(RelayInboxService, () => {
  // @covers sta-1910:FR-007 @covers sta-1910:AC-007
  it("hands a verified envelope to the inbox with the verified producer, whatever the body says", async () => {
    const { inbox, received } = inboxOf();
    const service = new RelayInboxService(new ScriptedVerifier(), inbox, clock);
    const response = await service.receive(
      post(JSON.stringify({ ...ENVELOPE, producer: "forged" })),
    );
    expect(response.status).toBe(204);
    expect(received).toEqual([{ ...ENVELOPE, producer: "payments" }]);
  });

  // @covers sta-1910:FR-008 @covers sta-1910:AC-002
  it("acknowledges a repeated delivery without handling it again", async () => {
    const { inbox, received } = inboxOf();
    const service = new RelayInboxService(new ScriptedVerifier(), inbox, clock);
    expect((await service.receive(post(JSON.stringify(ENVELOPE)))).status).toBe(204);
    expect((await service.receive(post(JSON.stringify(ENVELOPE)))).status).toBe(204);
    expect(received).toHaveLength(1);
  });

  // @covers sta-1910:FR-005 @covers sta-1910:FR-006 @covers sta-1910:AC-003
  it("refuses an unverified request with 401 and hands nothing to the inbox", async () => {
    const { inbox, received } = inboxOf();
    const verifier = new ScriptedVerifier();
    verifier.verdict = { verified: false, reason: "bad_signature" };
    const service = new RelayInboxService(verifier, inbox, clock);
    expect((await service.receive(post(JSON.stringify(ENVELOPE)))).status).toBe(401);
    expect(received).toEqual([]);
  });

  it("answers 422 for a verified body that is not an envelope, or an event this service does not know", async () => {
    const { inbox, state } = inboxOf();
    const service = new RelayInboxService(new ScriptedVerifier(), inbox, clock);
    expect((await service.receive(post("not json"))).status).toBe(422);
    expect(
      (await service.receive(post(JSON.stringify({ ...ENVELOPE, envelopeVersion: 2 })))).status,
    ).toBe(422);
    expect(
      (
        await service.receive(
          post(JSON.stringify({ ...ENVELOPE, type: "payments.payment.captured" })),
        )
      ).status,
    ).toBe(422);
    state.failWith = UnknownEventError.create({ type: ENVELOPE.type });
    expect((await service.receive(post(JSON.stringify(ENVELOPE)))).status).toBe(422);
  });

  it("answers 405 for a method but POST and 413 for a body over the limit", async () => {
    const { inbox } = inboxOf();
    const service = new RelayInboxService(new ScriptedVerifier(), inbox, clock);
    expect((await service.receive(new Request("https://billing.test/events/inbox"))).status).toBe(
      405,
    );
    expect((await service.receive(post("x".repeat(1_048_577)))).status).toBe(413);
  });

  it("lets a listener's error propagate, so the producer retries", async () => {
    const { inbox, state } = inboxOf();
    state.failWith = new TypeError("database down");
    const service = new RelayInboxService(new ScriptedVerifier(), inbox, clock);
    await expect(service.receive(post(JSON.stringify(ENVELOPE)))).rejects.toThrow("database down");
  });
});
