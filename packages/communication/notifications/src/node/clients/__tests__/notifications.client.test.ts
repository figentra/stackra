/**
 * Stackra file contract:
 * Purpose: unit tests of `NotificationsClient` and its `SEND_MESSAGE_ACTION` descriptor: `send.queue` hands the
 *          validated input to the transport's queue under `messages.message.send@1` and `POST /messages`, and an
 *          input the service's schema refuses never reaches the transport.
 * Boundary: test only; a fake `ClientTransport` records the queued requests.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0260 (decisions 3, 4 and 6).
 */
import { ClientTransport } from "@stackra/clients/contracts";
import type { ClientRequest } from "@stackra/clients/contracts";
import { HttpMethod } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { NotificationsClient } from "#node/clients/notifications.client";
import { SEND_MESSAGE_ACTION } from "#node/constants/send-message-action.constant";

const INPUT = {
  mail: "order_receipt",
  to: { principalId: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3" },
  subject: "Receipt ord_1",
  html: "<p>Thanks</p>",
  text: "Thanks",
} as const;

/** Records every queued request. */
class RecordingClientTransport extends ClientTransport {
  readonly queued: ClientRequest[] = [];

  send(): Promise<unknown> {
    return Promise.reject(new Error("not called"));
  }

  queue(request: ClientRequest): Promise<void> {
    this.queued.push(request);
    return Promise.resolve();
  }
}

describe("NotificationsClient", () => {
  it("queues messages.message.send@1 with the input", async () => {
    const transport = new RecordingClientTransport();
    await new NotificationsClient(transport).send(SEND_MESSAGE_ACTION).queue(INPUT);
    expect(transport.queued).toHaveLength(1);
    expect(transport.queued[0]).toMatchObject({
      key: "messages.message.send@1",
      kind: "action",
      endpoint: { method: HttpMethod.Post, path: "/messages" },
      input: INPUT,
    });
  });

  it("refuses an input the service would refuse", async () => {
    const transport = new RecordingClientTransport();
    const client = new NotificationsClient(transport);
    await expect(
      client.send(SEND_MESSAGE_ACTION).queue({ ...INPUT, mail: "Order-Receipt" }),
    ).rejects.toThrow();
    expect(transport.queued).toEqual([]);
  });
});
