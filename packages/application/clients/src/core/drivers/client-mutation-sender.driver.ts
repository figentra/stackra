/**
 * Stackra file contract:
 * Purpose: `ClientMutationSenderDriver`, the `client` driver of `@stackra/query`'s `MutationSender`: replays one queued
 *          call through the client's `ClientTransport` with the Idempotency-Key minted at queue time and its place in
 *          the device's order (the `DEVICE_ORDER` headers), and reports the outcome the queue needs (sent, refused for
 *          good with the code and server record, or not reached).
 * Boundary: finds the action's route and output schema by key among the loaded refs; a key no loaded ref has is a
 *           refusal for good (`unknown_action`), so it becomes a conflict record rather than a call that never leaves.
 *           Offline, a timeout, `401`, `429` and `5xx` are not reached: the entry waits for the next drain. A call the
 *           server refuses as out of order is a refusal like any other; the queue never sends one early.
 * Runtime: isomorphic
 * Governing contract: ADR 0059 (decisions 2 and 3); ADR 0138 (the idempotency step); ADR 0140 (envelope); ADR 0260;
 *                     ADR 0338 (decision 1).
 */
import { Driver } from "@stackra/container";
import type { Json } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { MutationSender } from "@stackra/query/contracts";
import type { DeviceOrder, ReplayOutcome } from "@stackra/query/contracts";

import { ClientTransport } from "#contracts/ports/client-transport.port";
import { CALL_REFS } from "#core/constants/call-refs.constant";

/** Kinds that mean the server may answer differently later, so the call was not refused for good. */
const NOT_REACHED: ReadonlySet<ErrorKind> = new Set([
  ErrorKind.Unauthenticated,
  ErrorKind.RateLimited,
  ErrorKind.Unavailable,
  ErrorKind.Internal,
]);

/** Replays queued calls through the client transport. */
export class ClientMutationSenderDriver extends Driver(MutationSender) {
  private readonly transport: ClientTransport;

  /** @param transport - the client's transport. */
  constructor(transport: ClientTransport) {
    super();
    this.transport = transport;
  }

  /** Sends `input` to the action keyed `action` with `idempotencyKey` and `order`, and reports how it went. */
  async send(
    action: string,
    input: Json,
    idempotencyKey: string,
    order: DeviceOrder,
  ): Promise<ReplayOutcome> {
    const ref = CALL_REFS.get(action);
    if (ref?.kind !== "action") return { ok: false, code: "unknown_action", server: null };
    try {
      await this.transport.send({
        key: action,
        kind: "action",
        ...(ref.endpoint === undefined ? {} : { endpoint: ref.endpoint }),
        input,
        output: ref.output,
        idempotencyKey,
        device: { deviceId: order.deviceId, sequence: order.sequence },
      });
      return { ok: true, code: null, server: null };
    } catch (error) {
      if (!isRefusal(error) || NOT_REACHED.has(error.kind))
        return { ok: false, code: null, server: null };
      const current = error.details["current"];
      return {
        ok: false,
        code: error.code,
        server: current === undefined ? null : (current as Json),
      };
    }
  }
}
