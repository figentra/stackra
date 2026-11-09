/**
 * Stackra file contract:
 * Purpose: unit tests of `serveGuardedCall` over the real `EdgeHeaderGuard` and its memory drivers: a correctly signed
 *          POST passes and reaches the call with its body fields and path parameters; a body swapped after signing is
 *          401 and never reaches the call; an unsigned request is refused; an oversized body is 413 before any guard; a
 *          GET with no body works; a request that fails a guard never reaches the authenticator; a bad `Authorization`
 *          header on an anonymous-allowing call is refused, not downgraded; a call with no header is anonymous only
 *          where it lists the anonymous actor; a refusal of the call is its kind's status; the refusal bodies do not
 *          say which check failed. Through the adapter, a call forwards a user's token only as ADR 0209's amendment
 *          allows: a user's bearer on a first hop, a service's forwarded token only into an action that declares
 *          `onBehalfOf: { secondHop: true }`, never through a controller, never anything into an action that declares
 *          `credentials: "ignore"` (which runs anonymous, its credential never verified), and the holder is empty once
 *          the call returned or threw.
 * Boundary: test only; real Web Crypto signing with `signEdgeRequest` against real `Date.now()`; the forwarding cases
 *           stub the authenticator and `fetch` and use throwaway token strings.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0237 (STA-2577 note); ADR 0437 (decision 4); ADR 0140.
 */
import { createHash } from "node:crypto";

import { Action } from "@stackra/actions";
import { ClientsConfig, HttpClientTransportDriver } from "@stackra/clients";
import { buildConfig } from "@stackra/config";
import { ActorKind, HttpMethod, Realm } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { ErrorKind, IdempotencyKeyInProgressError, Refusal } from "@stackra/errors";
import { MemoryServiceTokensDriver } from "@stackra/identity";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { z } from "zod";

import { EdgeHeader } from "#contracts/enums/edge-header.enum";
import { signEdgeRequest } from "#core/functions/sign-edge-request.function";
import { ON_BEHALF_OF_TOKEN } from "#server/constants/on-behalf-of-token.constant";
import { MemoryEdgeNonceStoreDriver } from "#server/drivers/memory-edge-nonce-store.driver";
import { MemoryEdgeSigningKeysDriver } from "#server/drivers/memory-edge-signing-keys.driver";
import { ServiceClientSessionDriver } from "#server/drivers/service-client-session.driver";
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

  it("refuses a bad Authorization header on a raw controller call too, never anonymous", async () => {
    const authenticate = vi.fn(async () => {
      throw BearerTokenInvalidError.create();
    });
    const execute = vi.fn(async () => new Response("ok"));
    const serve = async (headers: Record<string, string>) =>
      serveGuardedCall({
        request: await forwarded("GET", "/api/auth/callback", "", "", headers),
        path: "/api/auth/*rest",
        maxBodyBytes: 1024,
        anonymous: true,
        raw: true,
        guard: (guarded) => edgeGuard().check(guarded),
        authenticate,
        execute,
      });
    expect((await serve({ authorization: "Bearer expired" })).status).toBe(401);
    expect(execute).not.toHaveBeenCalled();
    // with no header the controller still runs, as an anonymous visitor
    const open = await serve({});
    expect(open.status).toBe(200);
    expect(await open.text()).toBe("ok");
    expect(execute).toHaveBeenCalledOnce();
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

  it("asks to retry in a second when the first call with the key is still running", async () => {
    const { serve } = call({ throws: IdempotencyKeyInProgressError.create() });
    const response = await serve(
      await forwarded("GET", "/orders/ord_1", "", "", { authorization: "Bearer t" }),
    );
    expect(response.status).toBe(409);
    expect(response.headers.get("Retry-After")).toBe("1");
    expect(await response.json()).toMatchObject({ code: "idempotency_key_in_progress" });
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

const USER_TOKEN = "throwaway-user-token";
const FORWARDED_TOKEN = "throwaway-forwarded-token";
const SERVICE_TOKEN = "throwaway-service-token";

const customer: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
  realm: Realm.Customer,
};
const shipping: Actor = { kind: ActorKind.Service, id: "svc_01j9z3k4m5n6p7q8r9s0t1v2w5" };

/** One hop: keeps a forwarded user token to itself. */
class PostSettlementAction extends Action({
  key: "cod_settlement.post",
  actors: [ActorKind.User, ActorKind.Service],
}) {
  async handle(): Promise<void> {}
}

/** Lets a forwarded user token travel once more. */
class IssueBalanceAction extends Action({
  key: "balance.issue",
  actors: [ActorKind.Service],
  onBehalfOf: { secondHop: true },
}) {
  async handle(): Promise<void> {}
}

/** A public page's action: its visitors may also be signed in elsewhere. */
class SubscribeAction extends Action({
  key: "newsletter.subscribe",
  actors: [ActorKind.Anonymous],
  credentials: "ignore",
}) {
  async handle(): Promise<void> {}
}

/** The generated clients' transport over a service's session, sending to Pay. */
function payTransport(): HttpClientTransportDriver {
  const config = buildConfig(ClientsConfig, {
    values: { baseUrl: "https://pay.internal", audiences: { pay: "pay-project" } },
  });
  const tokens = new MemoryServiceTokensDriver().seed({ "pay-project": SERVICE_TOKEN });
  return new HttpClientTransportDriver(config, new ServiceClientSessionDriver(tokens, config));
}

/**
 * Serves one call through the adapter with `headers`: the authenticator answers a user for a bare bearer and the
 * service acting for that user when a token is forwarded; the call sends one service call to Pay (or throws `fails`).
 * Answers the outgoing call's headers and the holder's reader as the call saw it.
 */
async function forwardingCall(
  headers: Record<string, string>,
  options: { action?: object; fails?: Error } = {},
) {
  const sent: Request[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((request: Request) => {
      sent.push(request);
      return Promise.resolve(Response.json({ posted: true }));
    }),
  );
  let reader: (() => string | undefined) | undefined;
  const answer = serveGuardedCall({
    request: new Request("https://api.example.test/settlements", {
      method: "POST",
      headers,
      body: "{}",
    }),
    path: "/settlements",
    maxBodyBytes: 1024,
    anonymous: false,
    ...(options.action === undefined ? { raw: true } : { action: options.action as never }),
    guard: async () => {},
    authenticate: async (credentials) => ({
      actor:
        credentials.onBehalfOf === undefined ? customer : { ...shipping, onBehalfOf: customer },
    }),
    execute: async () => {
      reader = ON_BEHALF_OF_TOKEN.getStore();
      await payTransport().send({
        key: "pay.ledger.post@1",
        kind: "action",
        endpoint: { method: HttpMethod.Post, path: "/ledger/posts" },
        input: {},
        output: z.object({ posted: z.boolean() }),
      });
      if (options.fails !== undefined) throw options.fails;
      return options.action === undefined ? new Response("ok") : { ok: true };
    },
  });
  return { answer, sent, reader: () => reader };
}

const userCall = { authorization: `Bearer ${USER_TOKEN}` };
const serviceCall = {
  authorization: `Bearer ${SERVICE_TOKEN}`,
  "stackra-on-behalf-of": FORWARDED_TOKEN,
};

describe("serveGuardedCall forwarding a caller's token (ADR 0209)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("holds a user's bearer on a first hop and sends it on the action's service call", async () => {
    const { answer, sent } = await forwardingCall(userCall, { action: PostSettlementAction });
    expect((await answer).status).toBe(200);
    expect(sent[0]?.headers.get("Authorization")).toBe(`Bearer ${SERVICE_TOKEN}`);
    expect(sent[0]?.headers.get("Stackra-On-Behalf-Of")).toBe(USER_TOKEN);
  });

  it("holds a forwarded token only into an action that declares a second hop", async () => {
    const oneHop = await forwardingCall(serviceCall, { action: PostSettlementAction });
    expect((await oneHop.answer).status).toBe(200);
    expect(oneHop.sent[0]?.headers.get("Authorization")).toBe(`Bearer ${SERVICE_TOKEN}`);
    expect(oneHop.sent[0]?.headers.has("Stackra-On-Behalf-Of")).toBe(false);
    const secondHop = await forwardingCall(serviceCall, { action: IssueBalanceAction });
    expect((await secondHop.answer).status).toBe(200);
    expect(secondHop.sent[0]?.headers.get("Stackra-On-Behalf-Of")).toBe(FORWARDED_TOKEN);
  });

  it("lets a controller forward a first hop's bearer, never a forwarded token", async () => {
    const first = await forwardingCall(userCall);
    expect((await first.answer).status).toBe(200);
    expect(first.sent[0]?.headers.get("Stackra-On-Behalf-Of")).toBe(USER_TOKEN);
    const second = await forwardingCall(serviceCall);
    expect((await second.answer).status).toBe(200);
    expect(second.sent[0]?.headers.has("Stackra-On-Behalf-Of")).toBe(false);
  });

  it('never verifies or holds the credential of an action that declares credentials: "ignore"', async () => {
    const authenticate = vi.fn(async () => ({ actor: customer }));
    const seen: [Actor, string | undefined][] = [];
    const serve = (headers: Record<string, string>) =>
      serveGuardedCall({
        request: new Request("https://api.example.test/newsletters/subscribe", {
          method: "POST",
          headers,
          body: "{}",
        }),
        path: "/newsletters/subscribe",
        maxBodyBytes: 1024,
        anonymous: true,
        action: SubscribeAction,
        guard: async () => {},
        authenticate,
        execute: async (_input, actor) => {
          seen.push([actor, ON_BEHALF_OF_TOKEN.getStore()?.()]);
          return { ok: true };
        },
      });
    for (const headers of [userCall, serviceCall, { authorization: "Bearer expired" }, {}])
      expect((await serve(headers)).status).toBe(200);
    expect(authenticate).not.toHaveBeenCalled();
    for (const [actor, token] of seen) {
      expect(actor.kind).toBe(ActorKind.Anonymous);
      expect(token).toBeUndefined();
    }
  });

  it("empties the holder once the call returned, was refused or threw", async () => {
    const returned = await forwardingCall(userCall, { action: PostSettlementAction });
    await returned.answer;
    const refused = await forwardingCall(userCall, {
      action: PostSettlementAction,
      fails: OrderLockedError.create(),
    });
    expect((await refused.answer).status).toBe(409);
    const threw = await forwardingCall(userCall, {
      action: PostSettlementAction,
      fails: new Error("boom"),
    });
    await expect(threw.answer).rejects.toThrow("boom");
    for (const { reader, sent } of [returned, refused, threw]) {
      expect(sent[0]?.headers.get("Stackra-On-Behalf-Of")).toBe(USER_TOKEN);
      expect(reader()).toBeDefined();
      expect(reader()?.()).toBeUndefined();
    }
    expect(ON_BEHALF_OF_TOKEN.getStore()).toBeUndefined();
  });
});
