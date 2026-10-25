/**
 * Stackra file contract:
 * Purpose: unit tests of `PushTransportFake` and `WhatsAppTransportFake`: each stands in for its port and sends once per
 *          idempotency key; the push fake answers `revoked` for a device marked gone.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0266 (decision 2); ADR 0269 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { PushTransport, WhatsAppTransport } from "#contracts/index";
import { PushTransportFake } from "#testing/push-transport.fake";
import { WhatsAppTransportFake } from "#testing/whatsapp-transport.fake";

describe("push and WhatsApp fakes", () => {
  it("stand in for their ports and send once per key", async () => {
    const push = new PushTransportFake(["ExponentPushToken[gone]"]);
    expect(push).toBeInstanceOf(PushTransport);
    const message = {
      target: { kind: "expo", token: "ExponentPushToken[a]" },
      title: "T",
      body: "B",
      ttlSeconds: 60,
    } as const;
    await expect(push.send(message, "k1")).resolves.toEqual({
      status: "sent",
      providerId: "fake_1",
    });
    await expect(push.send(message, "k1")).resolves.toEqual({
      status: "sent",
      providerId: "fake_1",
    });
    await expect(
      push.send({ ...message, target: { kind: "expo", token: "ExponentPushToken[gone]" } }, "k2"),
    ).resolves.toEqual({ status: "revoked" });
    expect(push.sent()).toHaveLength(2);

    const whatsapp = new WhatsAppTransportFake();
    expect(whatsapp).toBeInstanceOf(WhatsAppTransport);
    await expect(whatsapp.send({ to: "+966500000001", text: "Hi" }, "k1")).resolves.toBe("fake_1");
    await expect(whatsapp.send({ to: "+966500000001", text: "Again" }, "k1")).resolves.toBe(
      "fake_1",
    );
    expect(whatsapp.sent()).toEqual([{ to: "+966500000001", text: "Hi" }]);
  });
});
