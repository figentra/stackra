/**
 * Stackra file contract:
 * Purpose: `ClientAcknowledgementReaderDriver`, the `client` driver of `@stackra/query`'s `AcknowledgementReader`: asks
 *          the server for the device's last acknowledged sequence (the `DEVICE_ORDER` query and route) through the
 *          client's `ClientTransport`, sending the device's id as the device header, which `OfflineLock` counts as a
 *          sync (ADR 0338 decision 4).
 * Boundary: the answer `{ sequence: number | null }` is checked by its schema; a malformed answer, a refusal or a
 *           transport failure rejects, which the lock counts as no sync. The device is a header, never input: the
 *           server answers for the device it matched to the verified session's.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 4); ADR 0235 (devices are principals); ADR 0142 (transport through drivers).
 */
import { Driver } from "@stackra/container";
import { HttpMethod } from "@stackra/contracts";
import { AcknowledgementReader } from "@stackra/query/contracts";
import { z } from "zod";

import { DEVICE_ORDER } from "#contracts/constants/device-order.constant";
import type { ClientTransport } from "#contracts/ports/client-transport.port";

/** The acknowledged query's answer. */
const ACKNOWLEDGED_SCHEMA = z.object({ sequence: z.number().int().positive().nullable() });

/**
 * Reads the device's last acknowledged sequence through the client transport.
 *
 * @example
 * drivers: [{ port: AcknowledgementReader, candidates: { client: () => ClientAcknowledgementReaderDriver } }]
 */
export class ClientAcknowledgementReaderDriver extends Driver(AcknowledgementReader) {
  private readonly transport: ClientTransport;

  /**
   * @param transport - the client's transport.
   */
  constructor(transport: ClientTransport) {
    super();
    this.transport = transport;
  }

  /**
   * The highest sequence the server applied or rejected for `deviceId`, or `null` when it has none.
   *
   * @throws ClientError the server's refusal, or a `TransportError` when it was not reached.
   * @throws ZodError when the answer is not `{ sequence }`.
   */
  async lastAcknowledged(deviceId: string): Promise<number | null> {
    const answer = await this.transport.send({
      key: DEVICE_ORDER.acknowledgedQuery,
      kind: "query",
      endpoint: { method: HttpMethod.Get, path: DEVICE_ORDER.acknowledgedPath },
      input: {},
      output: ACKNOWLEDGED_SCHEMA,
      device: { deviceId },
    });
    return ACKNOWLEDGED_SCHEMA.parse(answer).sequence;
  }
}
