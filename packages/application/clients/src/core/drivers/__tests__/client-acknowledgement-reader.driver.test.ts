/**
 * Stackra file contract:
 * Purpose: unit tests of `ClientAcknowledgementReaderDriver`: it asks the `DEVICE_ORDER` query over its route with the
 *          device as the device header and no input, answers the sequence (or `null`), and rejects a transport failure
 *          or an answer that is not `{ sequence }`.
 * Boundary: test only; the transport is a stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0338 (decision 4).
 */
import { AcknowledgementReader } from "@stackra/query/contracts";
import { describe, expect, it } from "@stackra/testing";

import { TransportFailure } from "#contracts/enums/transport-failure.enum";
import { ClientTransport } from "#contracts/ports/client-transport.port";
import type { ClientRequest } from "#contracts/types/client-request.type";
import { ClientAcknowledgementReaderDriver } from "#core/drivers/client-acknowledgement-reader.driver";
import { TransportError } from "#core/errors/transport.error";

/** A transport that records the request and settles with `answer`. */
class StubTransport extends ClientTransport {
  readonly sent: ClientRequest[] = [];

  private readonly answer: () => Promise<unknown>;

  constructor(answer: () => Promise<unknown>) {
    super();
    this.answer = answer;
  }

  send(request: ClientRequest): Promise<unknown> {
    this.sent.push(request);
    return this.answer();
  }

  queue(): Promise<void> {
    return Promise.resolve();
  }
}

describe("ClientAcknowledgementReaderDriver", () => {
  it("asks the acknowledged query for the device and answers its sequence", async () => {
    const transport = new StubTransport(() => Promise.resolve({ sequence: 1_729_760_400_000 }));
    const reader = new ClientAcknowledgementReaderDriver(transport);
    expect(reader).toBeInstanceOf(AcknowledgementReader);
    expect(await reader.lastAcknowledged("device-1")).toBe(1_729_760_400_000);
    expect(transport.sent[0]).toMatchObject({
      key: "devices.device.acknowledged@1",
      kind: "query",
      endpoint: { method: "GET", path: "/devices/acknowledged" },
      input: {},
      device: { deviceId: "device-1" },
    });
    expect(transport.sent[0]?.device?.sequence).toBeUndefined();
  });

  it("answers null for a device the server settled nothing for", async () => {
    const reader = new ClientAcknowledgementReaderDriver(
      new StubTransport(() => Promise.resolve({ sequence: null })),
    );
    expect(await reader.lastAcknowledged("device-1")).toBeNull();
  });

  it("rejects when the server was not reached or answered something else", async () => {
    const offline = new ClientAcknowledgementReaderDriver(
      new StubTransport(() =>
        Promise.reject(TransportError.create({ reason: TransportFailure.Network })),
      ),
    );
    await expect(offline.lastAcknowledged("device-1")).rejects.toThrow(TransportError);
    const malformed = new ClientAcknowledgementReaderDriver(
      new StubTransport(() => Promise.resolve({ sequence: "seven" })),
    );
    await expect(malformed.lastAcknowledged("device-1")).rejects.toThrow();
  });
});
