/**
 * Stackra file contract:
 * Purpose: unit tests of `MailTransportFake`: it stands in for `MailTransport`, keeps mails in send order, answers a
 *          repeated idempotency key with the first id without keeping the mail again, and keeps a list per instance.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0266 (decision 2: a fake per capability).
 */
import { describe, expect, it } from "@stackra/testing";

import { MailTransport, type OutboundMail } from "#contracts/index";
import { MailTransportFake } from "#testing/mail-transport.fake";

const mail = (subject: string): OutboundMail => ({
  to: "a@acme.example",
  from: "orders@acme.example",
  subject,
  html: `<p>${subject}</p>`,
  text: subject,
});

describe("MailTransportFake", () => {
  it("stands in for MailTransport", () => {
    expect(new MailTransportFake()).toBeInstanceOf(MailTransport);
  });

  it("sends once per idempotency key", async () => {
    const transport = new MailTransportFake();
    const first = await transport.send(mail("Receipt"), "k1");
    const again = await transport.send(mail("Receipt again"), "k1");
    const other = await transport.send(mail("Placed"), "k2");
    expect(again).toBe(first);
    expect(other).not.toBe(first);
    expect(transport.sent().map((sent) => sent.subject)).toEqual(["Receipt", "Placed"]);
  });

  it("keeps a list per instance", async () => {
    await new MailTransportFake().send(mail("Receipt"), "k1");
    expect(new MailTransportFake().sent()).toEqual([]);
  });
});
