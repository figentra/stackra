/**
 * Stackra file contract:
 * Purpose: unit tests of the `WebhookSender` port: it is a `Port` whose class is its token, keyed
 *          `webhooks.WebhookSender`, and a driver subclass implements `send` and reports the status.
 * Boundary: test only; a minimal in-test driver stands in for a real one.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0142 (drivers behind ports); ADR 0224 (decision 3).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { WebhookSender } from "#contracts/ports/webhook-sender.port";
import type { WebhookRequest } from "#contracts/types/webhook-request.type";

/** A driver that answers 204 to everything. */
class AcceptingWebhookSenderDriver extends Driver(WebhookSender) {
  readonly sent: WebhookRequest[] = [];

  async send(request: WebhookRequest): Promise<number> {
    this.sent.push(request);
    return 204;
  }
}

describe("WebhookSender", () => {
  it("is a port a driver implements", async () => {
    const driver = new AcceptingWebhookSenderDriver();
    const sender: WebhookSender = driver;
    expect(sender).toBeInstanceOf(WebhookSender);
    expect(sender).toBeInstanceOf(Port);
    const request = { url: "https://hooks.acme.example/in", headers: {}, body: "{}" };
    await expect(sender.send(request)).resolves.toBe(204);
    expect(driver.sent).toEqual([request]);
  });

  it("is keyed webhooks.WebhookSender", () => {
    expectTypeOf<WebhookSender["~key"]>().toEqualTypeOf<"webhooks.WebhookSender">();
    expectTypeOf<WebhookRequest["body"]>().toEqualTypeOf<string>();
  });
});
