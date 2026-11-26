/**
 * Stackra file contract:
 * Purpose: unit tests of `emitInbox` and `inboxProducersOf`: a service with a listener of a contract-only producer's
 *          event gets `InboundEventsController` on `/events/inbox` over `RelayInboxService` (raw body, empty answer, a
 *          thrown error as 500) and `RelayInboxConfig` with the pinned producer's keys and events; a sibling producer,
 *          an app and a service without such a listener get nothing.
 * Boundary: test only; runs on the cross-app IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0511 (amendment of 2026-11-02, decision 18); STA-1910.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitInbox } from "#core/functions/emit-inbox.function";
import { inboxProducersOf } from "#core/functions/inbox-producers-of.function";
import { INBOX_IR, PAY_CONTRACT, PLAIN_IR } from "#core/__tests__/fixtures/cross-app-ir.fixture";

describe(emitInbox, () => {
  const inbox = emitInbox(INBOX_IR) ?? "";

  it("hands the raw body to RelayInboxService and answers its status with no body", () => {
    expect(inbox).toContain(
      'export class InboundEventsController extends Controller({ path: "/events/inbox" }) {',
    );
    expect(inbox).toContain("  constructor(inbox: RelayInboxService) {");
    expect(inbox).toContain("        body: new Uint8Array(await request.arrayBuffer()),");
    expect(inbox).toContain("      status = 500;");
    expect(inbox).toContain("    return new Response(null, { status });");
  });

  it("binds the pinned producers' keys and events into RelayInboxConfig", () => {
    expect(inbox).toContain(
      '  "pay": { keys: {"dev":[{"id":"pay-dev-1","publicKey":"cGF5LWRldi1wdWJsaWM"}]}, events: ["payments.payment.captured.v1"] },',
    );
    expect(inbox).toContain("export class RelayInboxConfig extends BaseRelayInboxConfig {");
    expect(inbox).toContain(
      'import { RelayInboxConfig as BaseRelayInboxConfig } from "@stackra/outbox";',
    );
  });

  it("writes nothing for a sibling producer, an app or a service without such a listener", () => {
    const sibling = {
      ...INBOX_IR,
      services: [{ member: "pay", folder: "pay", manifest: PAY_CONTRACT }],
    };
    expect(emitInbox(sibling)).toBeUndefined();
    expect(emitInbox({ ...INBOX_IR, layout: "app" })).toBeUndefined();
    expect(emitInbox(PLAIN_IR)).toBeUndefined();
    expect(inboxProducersOf(INBOX_IR).map((row) => row.service)).toEqual(["pay"]);
  });
});
