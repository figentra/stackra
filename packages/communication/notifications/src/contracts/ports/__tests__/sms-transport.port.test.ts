/**
 * Stackra file contract:
 * Purpose: unit and type tests of `SmsTransport`: a port (abstract, `Port`-branded), implemented by a driver with
 *          `Driver(SmsTransport)` that TypeScript makes implement `send`.
 * Boundary: test only; the driver is shaped like a provider driver that answers the provider's id.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 16 and 17); ADR 0305 (rule 8).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SmsTransport } from "#contracts/ports/sms-transport.port";
import type { OutboundSms } from "#contracts/types/outbound-sms.type";

const SMS: OutboundSms = { to: "+966500000001", from: "ACME", text: "رمزك 123456" };

class MemorySmsTransportDriver extends Driver(SmsTransport) {
  readonly messages: OutboundSms[] = [];

  send(sms: OutboundSms, idempotencyKey: string): Promise<string> {
    this.messages.push(sms);
    return Promise.resolve(`mem_${idempotencyKey}`);
  }
}

describe("SmsTransport", () => {
  it("is a port a driver implements", async () => {
    const driver = new MemorySmsTransportDriver();
    expect(driver).toBeInstanceOf(SmsTransport);
    expect(driver).toBeInstanceOf(Port);
    await expect(driver.send(SMS, "k1")).resolves.toBe("mem_k1");
    expect(driver.messages).toEqual([SMS]);
  });

  it("types send as message and idempotency key to the provider id", () => {
    expectTypeOf<SmsTransport["send"]>().parameters.toEqualTypeOf<[OutboundSms, string]>();
    expectTypeOf<SmsTransport["send"]>().returns.toEqualTypeOf<Promise<string>>();
    // @ts-expect-error a driver must implement send
    class Empty extends Driver(SmsTransport) {}
    expect(Empty).toBeTypeOf("function");
  });

  it("refuses a number outside E.164 form", () => {
    // @ts-expect-error the number starts with +
    const sms: OutboundSms = { to: "0500000001", from: "ACME", text: "t" };
    expect(sms.text).toBe("t");
  });
});
