/**
 * Stackra file contract:
 * Purpose: unit tests of `emitEncoreInbox`: the inbox's Encore adapter is one exposed `api.raw` endpoint on
 *          `POST /events/inbox` outside session auth, passing the raw body through `answerHttp` to the generated
 *          controller; a service without the inbox gets none.
 * Boundary: test only; runs on the cross-app IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0511 (amendment of 2026-11-02, decision 18); STA-1910.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitEncoreInbox } from "#core/functions/emit-encore-inbox.function";
import { INBOX_IR, PRODUCER_IR } from "#core/__tests__/fixtures/cross-app-ir.fixture";

describe(emitEncoreInbox, () => {
  it("writes one raw, exposed, unauthenticated endpoint through answerHttp", () => {
    const file = emitEncoreInbox(INBOX_IR);
    expect(file?.path).toBe("stackra-encore/billing/inbox.ts");
    expect(file?.content).toContain(
      '  { expose: true, auth: false, method: "POST", path: "/events/inbox" },',
    );
    expect(file?.content).toContain("export const eventsInbox = api.raw(");
    expect(file?.content).toContain("      body: Buffer.concat(chunks),");
    expect(file?.content).toContain(
      "      container.get(InboundEventsController).handle(incoming),",
    );
    expect(file?.content).toContain('import { answerHttp } from "./http";');
  });

  it("answers 413 before it buffers a body over the cap", () => {
    const content = emitEncoreInbox(INBOX_IR)?.content ?? "";
    expect(content).toContain("const MAX_INBOX_BYTES = 1_048_576;");
    expect(content).toContain("        resp.writeHead(413);");
  });

  it("writes nothing for a service without the inbox", () => {
    expect(emitEncoreInbox(PRODUCER_IR)).toBeUndefined();
  });
});
