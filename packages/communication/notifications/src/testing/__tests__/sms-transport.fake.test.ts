/**
 * Stackra file contract:
 * Purpose: unit tests of `SmsTransportFake`: it stands in for the port, keeps each message once per idempotency key
 *          and answers a repeated key with the first id.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0266 (decision 2); ADR 0269 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { SmsTransport } from "#contracts/index";
import type { OutboundSms } from "#contracts/index";
import { SmsTransportFake } from "#testing/sms-transport.fake";

const SMS: OutboundSms = { to: "+966500000001", from: "ACME", text: "رمزك 123456" };

describe("SmsTransportFake", () => {
  it("stands in for the port", () => {
    expect(new SmsTransportFake()).toBeInstanceOf(SmsTransport);
  });

  it("sends once per idempotency key", async () => {
    const sms = new SmsTransportFake();
    await expect(sms.send(SMS, "k1")).resolves.toBe("fake_1");
    await expect(sms.send({ ...SMS, text: "again" }, "k1")).resolves.toBe("fake_1");
    await expect(sms.send(SMS, "k2")).resolves.toBe("fake_2");
    expect(sms.sent()).toEqual([SMS, SMS]);
  });
});
