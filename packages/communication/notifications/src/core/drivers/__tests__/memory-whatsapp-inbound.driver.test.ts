/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryWhatsAppInboundDriver`: pushed messages come out of the next `read` in order, whatever
 *          the body, and only once; the driver is a `WhatsAppInbound`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0448.
 */
import { describe, expect, it } from "@stackra/testing";

import { WhatsAppInbound } from "#contracts/ports/whatsapp-inbound.port";
import type { InboundWhatsApp } from "#contracts/types/inbound-whatsapp.type";
import { MemoryWhatsAppInboundDriver } from "#core/drivers/memory-whatsapp-inbound.driver";

const AT = new Date("2026-10-27T09:00:00Z");
const HELLO: InboundWhatsApp = {
  kind: "text",
  id: "m1",
  from: "+966500000001",
  channelId: "c1",
  at: AT,
  text: "hello",
};
const YES: InboundWhatsApp = {
  kind: "reply",
  id: "m2",
  from: "+966500000001",
  channelId: "c1",
  at: AT,
  replyId: "cod_confirm",
  title: "Yes",
};

describe("MemoryWhatsAppInboundDriver", () => {
  it("is the port's driver", () => {
    expect(new MemoryWhatsAppInboundDriver()).toBeInstanceOf(WhatsAppInbound);
  });

  it("hands out what was pushed, once", async () => {
    const inbound = new MemoryWhatsAppInboundDriver();
    inbound.push(HELLO);
    inbound.push(YES);
    expect(await inbound.read("ignored")).toEqual([HELLO, YES]);
    expect(await inbound.read("ignored")).toEqual([]);
  });
});
