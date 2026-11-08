/**
 * Stackra file contract:
 * Purpose: unit tests of `serveGuardedCall` over the real `EdgeHeaderGuard` and its memory drivers: a correctly signed
 *          POST passes and reaches the call with its body fields and path parameters; a body swapped after signing is
 *          401 and never reaches the call; an unsigned request is refused; an oversized body is 413 before any guard; a
 *          GET with no body works; a request that fails a guard never reaches the authenticator; a bad `Authorization`
 *          header on an anonymous-allowing call is refused, not downgraded; a call with no header is anonymous only
 *          where it lists the anonymous actor; a refusal of the call is its kind's status; the refusal bodies do not
 *          say which check failed.
 * Boundary: test only; real Web Crypto signing with `signEdgeRequest` against real `Date.now()`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0237 (STA-2577 note); ADR 0437 (decision 4); ADR 0140.
 */
import { createHash } from "node:crypto";

import { ActorKind } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { EdgeHeader } from "#contracts/enums/edge-header.enum";
import { signEdgeRequest } from "#core/functions/sign-edge-request.function";
import { MemoryEdgeNonceStoreDriver } from "#server/drivers/memory-edge-nonce-store.driver";
import { MemoryEdgeSigningKeysDriver } from "#server/drivers/memory-edge-signing-keys.driver";
import { BearerTokenInvalidError } from "#server/errors/bearer-token-invalid.error";
import { serveGuardedCall } from "#server/functions/serve-guarded-call.function";
import { EdgeHeaderGuard } from "#server/services/edge-header.guard";

const SECRET = "edge-secret";
const USER: Actor = { kind: ActorKind.Service, id: "svc_01H2J3K4L5M6N7P8Q9R0S1T2U3" as never };

class OrderLockedError extends Refusal({ kind: ErrorKind.Conflict }) {}

let next = 0;

/** A request as the edge forwards it, signed over `signed` and sent with `sent` (default `signed`). */
async function forwarded(
  method: string,
  path: string,
  signed: string,
  sent: string = signed,
  extra: Record<string, string> = {},
): Promise<Request> {
  const input = {
    scope: null,
    product: "commerce",
    surface: "console",
    realm: "staff",
    requestId: `req-${(next += 1)}`,
    timestamp: Math.floor(Date.now() / 1000),
    method,
    path,
    bodyHash: createHash("sha256").update(signed).digest("hex"),
  };
  const headers = new Headers({
    [EdgeHeader.Product]: input.product,
    [EdgeHeader.Surface]: input.surface,
    [EdgeHeader.Realm]: input.realm,
    [EdgeHeader.RequestId]: input.requestId,
    [EdgeHeader.Timestamp]: String(input.timestamp),
    [EdgeHeader.Signature]: await signEdgeRequest(input, SECRET),
    ...extra,
  });
  return new Request(`https://api.example.test${path}`, {
    method,
    headers,
    ...(sent === "" ? {} : { body: sent }),
  });
}

/** The edge guard over memory drivers. */
function edgeGuard(): EdgeHeaderGuard {
  const keys = new MemoryEdgeSigningKeysDriver();
  keys.secrets = [SECRET];
  return new EdgeHeaderGuard(keys, new MemoryEdgeNonceStoreDriver());
}

/** A call under the real guard, with spies on the authenticator and the call. */
function call(options: { anonymous?: boolean; maxBodyBytes?: number; throws?: Error } = {}) {
  const guard = edgeGuard();
  const authenticate = vi.fn(async () => ({ actor: USER }));
  const execute = vi.fn(async (input: unknown, _actor: Actor) => {
    if (options.throws !== undefined) throw options.throws;
    return { echoed: input };
  });
  const serve = (request: Request) =>
    serveGuardedCall({
      request,
      path: "/orders/:orderId",
      maxBodyBytes: options.maxBodyBytes ?? 1024,
      anonymous: options.anonymous ?? false,
      guard: (guarded) => guard.check(guarded),
      authenticate,
      execute,
    });
  return { serve, authenticate, execute };
}

describe(serveGuardedCall, () => {
  it("runs a correctly signed POST through the call with its body fields and path parameters", async () => {
    const { serve, execute } = call();
    const body = '{"reason":"late","orderId":"spoofed"}';
    const response = await serve(
      await forwarded("POST", "/orders/ord_1", body, body, { authorization: "Bearer t" }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ echoed: { reason: "late", orderId: "ord_1" } });
    expect(execute).toHaveBeenCalledOnce();
  });

  it("refuses a body swapped after signing and never runs the call", async () => {
    const { serve, execute, authenticate } = call();
    const response = await serve(
      await forwarded("POST", "/orders/ord_1", '{"total":10}', '{"total":9999}', {
        authorization: "Bearer t",
      }),
    );
    expect(response.status).toBe(401);
    expect(execute).not.toHaveBeenCalled();
    expect(authenticate).not.toHaveBeenCalled();
  });

  it("refuses an unsigned request where the edge guard is bound", async () => {
    const { serve, execute } = call({ anonymous: true });
    const request = new Request("https://api.example.test/orders/ord_1", {
      method: "POST",
      body: "{}",
    });
    expect((await serve(request)).status).toBe(401);
    expect(execute).not.toHaveBeenCalled();
  });

  it("answers 413 for an oversized body before any guard runs", async () => {
    const guard = vi.fn(async () => undefined);
    const request = new Request("https://api.example.test/orders", {
      method: "POST",
      body: "x".repeat(2048),
    });
    const response = await serveGuardedCall({
      request,
      path: "/orders",
      maxBodyBytes: 1024,
      anonymous: true,
      guard,
      authenticate: async () => ({ actor: USER }),
      execute: async () => ({}),
    });
    expect(response.status).toBe(413);
    expect(guard).not.toHaveBeenCalled();
  });

  it("serves a GET with no body, reading the query string", async () => {
    const { serve, execute } = call();
    const response = await serve(
      await forwarded("GET", "/orders/ord_1?expand=lines", "", "", { authorization: "Bearer t" }),
    );
    expect(response.status).toBe(200);
    expect(execute.mock.calls[0]?.[0]).toEqual({ expand: "lines", orderId: "ord_1" });
  });

  it("never reaches the authenticator when a guard refuses", async () => {
    const { serve, authenticate } = call();
    const request = new Request("https://api.example.test/orders/ord_1", {
      headers: { authorization: "Bearer t" },
    });
    expect((await serve(request)).status).toBe(401);
    expect(authenticate).not.toHaveBeenCalled();
  });

  it("refuses a bad Authorization header on an anonymous-allowing call instead of downgrading it", async () => {
    const { serve, authenticate, execute } = call({ anonymous: true });
    authenticate.mockRejectedValueOnce(BearerTokenInvalidError.create());
    const response = await serve(
      await forwarded("GET", "/orders/ord_1", "", "", { authorization: "Bearer bad" }),
    );
    expect(response.status).toBe(401);
    expect(authenticate).toHaveBeenCalledOnce();
    expect(execute).not.toHaveBeenCalled();
  });

  it("runs as an anonymous visitor only where the call lists the anonymous actor", async () => {
    const open = call({ anonymous: true });
    expect((await open.serve(await forwarded("GET", "/orders/ord_1", "", ""))).status).toBe(200);
    expect(open.execute.mock.calls[0]?.[1].kind).toBe(ActorKind.Anonymous);
    expect(open.authenticate).not.toHaveBeenCalled();

    const closed = call();
    expect((await closed.serve(await forwarded("GET", "/orders/ord_1", "", ""))).status).toBe(401);
    expect(closed.execute).not.toHaveBeenCalled();
  });

  it("answers a refusal of the call with its kind's status and envelope", async () => {
    const { serve } = call({ throws: OrderLockedError.create() });
    const response = await serve(
      await forwarded("GET", "/orders/ord_1", "", "", { authorization: "Bearer t" }),
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "order_locked", category: "conflict" });
  });

  it("answers 400 for a body that is not a JSON object", async () => {
    const { serve, execute } = call();
    const response = await serve(
      await forwarded("POST", "/orders/ord_1", "[1]", "[1]", { authorization: "Bearer t" }),
    );
    expect(response.status).toBe(400);
    expect(execute).not.toHaveBeenCalled();
  });

  it("does not say which check failed", async () => {
    const { serve } = call();
    const unsigned = await serve(
      new Request("https://api.example.test/orders/ord_1", { method: "POST", body: "{}" }),
    );
    const swapped = await serve(await forwarded("POST", "/orders/ord_1", "{}", '{"a":1}'));
    const [first, second] = [await unsigned.text(), await swapped.text()];
    expect(first).toBe(second);
    expect(first).not.toMatch(/signature|edge|body|hash|origin|csrf/i);
  });
});
