/**
 * Stackra file contract:
 * Purpose: unit tests of `ClientMutationSenderDriver`: a replay goes through the transport with the queued key, its
 *          device order and its route, and its outcome is sent, refused for good (code and the server's current record), or not reached
 *          (offline, 401, 429, 5xx); an unknown action is refused for good.
 * Boundary: test only; the transport is a stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0059 (decisions 2 and 3); ADR 0138; ADR 0338 (decision 1).
 */
import { HttpMethod } from "@stackra/contracts";
import { ErrorKind } from "@stackra/errors";
import { refusal } from "@stackra/errors/testing";
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { TransportFailure } from "#contracts/enums/transport-failure.enum";
import { ClientTransport } from "#contracts/ports/client-transport.port";
import type { ClientRequest } from "#contracts/types/client-request.type";
import { ClientMutationSenderDriver } from "#core/drivers/client-mutation-sender.driver";
import { TransportError } from "#core/errors/transport.error";
import { actionRef } from "#core/functions/action-ref.function";
import { refusalRef } from "#core/functions/refusal-ref.function";

actionRef("catalogue.product.archive@1", {
  input: z.object({ productId: z.string() }),
  output: z.object({ productId: z.string() }),
  http: { method: HttpMethod.Put, path: "/products/:productId/archive" },
});

class VersionConflictError extends refusalRef("catalogue.version_conflict", {
  kind: ErrorKind.Conflict,
}) {}

class UnauthenticatedError extends refusalRef("identity.unauthenticated", {
  kind: ErrorKind.Unauthenticated,
}) {}

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

const ORDER = { deviceId: "device-1", sequence: 1_729_760_400_000 };

const replay = (answer: () => Promise<unknown>) => {
  const transport = new StubTransport(answer);
  const sending = new ClientMutationSenderDriver(transport).send(
    "catalogue.product.archive@1",
    { productId: "prd_1" },
    "key-1",
    ORDER,
  );
  return { transport, sending };
};

describe("ClientMutationSenderDriver", () => {
  it("replays with the queued key, the device order and the action's route", async () => {
    const { transport, sending } = replay(() => Promise.resolve({ productId: "prd_1" }));
    expect(await sending).toEqual({ ok: true, code: null, server: null });
    expect(transport.sent[0]).toMatchObject({
      key: "catalogue.product.archive@1",
      kind: "action",
      endpoint: { method: "PUT", path: "/products/:productId/archive" },
      input: { productId: "prd_1" },
      idempotencyKey: "key-1",
      device: ORDER,
    });
  });

  it("reports a refusal for good with its code and the server's current record", async () => {
    const conflict = refusal(VersionConflictError);
    Object.defineProperty(conflict, "current", { value: { version: 4 }, enumerable: true });
    const { sending } = replay(() => Promise.reject(conflict));
    expect(await sending).toEqual({ ok: false, code: "version_conflict", server: { version: 4 } });
  });

  it("reports offline, 401 and other transient failures as not reached", async () => {
    const offline = replay(() =>
      Promise.reject(TransportError.create({ reason: TransportFailure.Network })),
    );
    expect(await offline.sending).toEqual({ ok: false, code: null, server: null });
    const signedOut = replay(() => Promise.reject(refusal(UnauthenticatedError)));
    expect(await signedOut.sending).toEqual({ ok: false, code: null, server: null });
  });

  it("refuses an action no loaded ref has", async () => {
    const driver = new ClientMutationSenderDriver(new StubTransport(() => Promise.resolve({})));
    expect(await driver.send("orders.order.unknown@1", {}, "key-2", ORDER)).toEqual({
      ok: false,
      code: "unknown_action",
      server: null,
    });
  });
});
