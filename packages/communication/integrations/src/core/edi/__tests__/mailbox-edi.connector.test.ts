/**
 * Stackra file contract:
 * Purpose: unit tests of `MailboxEdiConnector` over `MemoryEdiMailbox`: an order sent twice under one key is put once
 *          as an X12 interchange to the partner; a body without segments or a partner without a qualifier is refused;
 *          the recorded 850 and ORDERS are received as canonical documents with their reference; acknowledging sends
 *          the 997 or CONTRL once and removes the interchange; an incoming 997 is removed without an answer; a message
 *          outside the canonical set is refused and left in the mailbox.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0447 (decision 4); stackra-46 re-scope (R2-7, M6); STA-795.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { EdiDocumentType } from "#contracts/enums/edi-document-type.enum";
import { EDIFACT_ORDER } from "#core/edi/__tests__/edifact-order.constant";
import { X12_ORDER } from "#core/edi/__tests__/x12-order.constant";
import { MailboxEdiConnector } from "#core/edi/mailbox-edi.connector";
import { MalformedEdiError } from "#core/edi/malformed-edi.error";
import { MemoryEdiMailbox } from "#core/edi/memory-edi-mailbox.driver";
import { readInterchange } from "#core/edi/read-interchange.function";
import { ProviderRefusedError } from "#core/errors/provider-refused.error";

const x12 = { syntax: "x12", sender: "ZZ:FIGENTRA", version: "00401", test: true } as const;
const order = {
  type: EdiDocumentType.Order,
  partner: "ZZ:ACMEFOODS",
  reference: "PO-1",
  issuedAt: new Date("2026-10-28T09:30:00Z"),
  body: {
    segments: [
      ["BEG", "00", "SA", "PO-1", "", "20261028"],
      ["CTT", "0"],
    ],
  },
};

describe("MailboxEdiConnector", () => {
  it("puts an order once per key as an X12 interchange", async () => {
    const mailbox = new MemoryEdiMailbox();
    const edi = new MailboxEdiConnector(mailbox, x12);
    await expect(edi.send(order, "po:1")).resolves.toEqual({ id: "po:1" });
    await expect(edi.send(order, "po:1")).resolves.toEqual({ id: "po:1" });
    expect(mailbox.sent.size).toBe(1);
    const sent = readInterchange(mailbox.sent.get("po:1") ?? "");
    expect(sent).toMatchObject({
      receiver: { qualifier: "ZZ", id: "ACMEFOODS" },
      control: "000000001",
    });
    expect(sent.messages[0]).toMatchObject({ code: "850", segments: order.body.segments });
  });

  it("refuses a body without segments or a partner without a qualifier", async () => {
    const edi = new MailboxEdiConnector(new MemoryEdiMailbox(), x12);
    for (const document of [
      { ...order, body: {} },
      { ...order, partner: "ACMEFOODS" },
    ]) {
      const error = await edi.send(document, "k").catch((caught: unknown) => caught);
      expect(isRefusal(error, ProviderRefusedError)).toBe(true);
    }
  });

  it("receives the recorded interchanges as canonical documents", async () => {
    const mailbox = new MemoryEdiMailbox();
    mailbox.deliver("in_1", X12_ORDER, new Date("2026-10-28T09:31:00Z"));
    mailbox.deliver("in_2", EDIFACT_ORDER, new Date("2026-10-28T09:32:00Z"));
    const page = await new MailboxEdiConnector(mailbox, x12).receive(
      new Date("2026-10-28T00:00:00Z"),
    );
    expect(page.next).toBeUndefined();
    expect(
      page.documents.map(({ id, type, partner, reference }) => ({ id, type, partner, reference })),
    ).toEqual([
      { id: "in_1", type: "order", partner: "ZZ:ACMEFOODS", reference: "PO-7781" },
      { id: "in_2", type: "order", partner: "14:5012345678901", reference: "PO-7782" },
    ]);
    expect(page.documents[0]?.body).toMatchObject({ control: "0001" });
  });

  it("acknowledges once and removes the interchange", async () => {
    const mailbox = new MemoryEdiMailbox();
    mailbox.deliver("in_1", X12_ORDER);
    mailbox.deliver("in_2", EDIFACT_ORDER);
    const edi = new MailboxEdiConnector(mailbox, x12);
    await edi.acknowledge("in_1");
    await edi.acknowledge("in_1");
    await edi.acknowledge("in_2");
    expect(mailbox.inbox.size).toBe(0);
    expect(readInterchange(mailbox.sent.get("ack:in_1") ?? "").messages[0]?.code).toBe("997");
    expect(readInterchange(mailbox.sent.get("ack:in_2") ?? "").messages[0]?.code).toBe("CONTRL");
    expect(mailbox.sent.size).toBe(2);
  });

  it("removes an incoming acknowledgement without answering it", async () => {
    const mailbox = new MemoryEdiMailbox();
    const edi = new MailboxEdiConnector(mailbox, x12);
    mailbox.deliver("in_1", X12_ORDER);
    await edi.acknowledge("in_1");
    mailbox.deliver("in_2", mailbox.sent.get("ack:in_1") ?? "");
    const [received] = (await edi.receive(new Date(0))).documents;
    expect(received?.type).toBe("acknowledgement");
    await edi.acknowledge("in_2");
    expect(mailbox.sent.size).toBe(1);
    expect(mailbox.inbox.size).toBe(0);
  });

  it("refuses a message outside the canonical set and leaves it", async () => {
    const mailbox = new MemoryEdiMailbox();
    mailbox.deliver("in_1", X12_ORDER.replaceAll("850", "940"));
    const error = await new MailboxEdiConnector(mailbox, x12)
      .receive(new Date(0))
      .catch((caught: unknown) => caught);
    expect(isRefusal(error, MalformedEdiError)).toBe(true);
    expect(mailbox.inbox.has("in_1")).toBe(true);
  });
});
