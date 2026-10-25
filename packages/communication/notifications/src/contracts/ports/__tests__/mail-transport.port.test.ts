/**
 * Stackra file contract:
 * Purpose: unit and type tests of `MailTransport`: a port (abstract, `Port`-branded), implemented by a driver with
 *          `Driver(MailTransport)` that TypeScript makes implement `send`, and subclassed directly by a test double.
 * Boundary: test only; the drivers are shaped like the notifications service's `memory` driver and the template's
 *           always-failing transport.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 16 and 17); ADR 0305 (rule 8).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { MailTransport } from "#contracts/ports/mail-transport.port";
import type { OutboundMail } from "#contracts/types/outbound-mail.type";

const MAIL: OutboundMail = {
  to: "a@acme.example",
  from: "orders@acme.example",
  subject: "Receipt",
  html: "<p>شكراً</p>",
  text: "شكراً",
};

class MemoryMailTransportDriver extends Driver(MailTransport) {
  readonly mails: OutboundMail[] = [];

  send(mail: OutboundMail, idempotencyKey: string): Promise<string> {
    this.mails.push(mail);
    return Promise.resolve(`mem_${idempotencyKey}`);
  }
}

class DownMailTransport extends MailTransport {
  send(): Promise<string> {
    return Promise.reject(new RangeError("provider down"));
  }
}

describe("MailTransport", () => {
  it("is a port a driver implements", async () => {
    const driver = new MemoryMailTransportDriver();
    expect(driver).toBeInstanceOf(MailTransport);
    expect(driver).toBeInstanceOf(Port);
    await expect(driver.send(MAIL, "k1")).resolves.toBe("mem_k1");
    expect(driver.mails).toEqual([MAIL]);
  });

  it("is subclassed directly by a test double", async () => {
    const down = new DownMailTransport();
    expect(down).toBeInstanceOf(MailTransport);
    await expect(down.send()).rejects.toThrow("provider down");
  });

  it("types send as mail and idempotency key to the provider id", () => {
    expectTypeOf<MailTransport["send"]>().parameters.toEqualTypeOf<[OutboundMail, string]>();
    expectTypeOf<MailTransport["send"]>().returns.toEqualTypeOf<Promise<string>>();
    // @ts-expect-error a driver must implement send
    class Empty extends Driver(MailTransport) {}
    expect(Empty).toBeTypeOf("function");
  });
});
