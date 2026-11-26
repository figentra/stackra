/**
 * Stackra file contract:
 * Purpose: unit tests of `EdgeHeaderGuard`: it runs first (order -100); it lets through a request signed with
 *          either active key, a platform host's request without a scope, and a request with no edge header at all (not
 *          edge traffic: authentication decides); it refuses any edge header without a signature (an identity header,
 *          or only a request id or timestamp), an unknown key, a tampered body or path, a timestamp outside the window
 *          either side (on a pinned clock, both edges accepted), a missing identity header, a replayed request id, and
 *          every signature when no key is active. It records a request's signed tenant only once the signature and
 *          the request id verified: never for a platform host, a request with no edge header or a refused one; a
 *          correctly signed scope that is not an `scp_` public id is refused (fail closed).
 * Boundary: test only; real Web Crypto, the memory drivers, and requests built as the edge Worker forwards them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0437 (decisions 4 and 8; Enforcement); ADR 0457.
 */
import { createHash } from "node:crypto";

import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { EdgeHeader } from "#contracts/enums/edge-header.enum";
import { signEdgeRequest } from "#core/functions/sign-edge-request.function";
import { VERIFIED_EDGE_SCOPE } from "#server/constants/verified-edge-scope.constant";
import { MemoryEdgeNonceStoreDriver } from "#server/drivers/memory-edge-nonce-store.driver";
import { MemoryEdgeSigningKeysDriver } from "#server/drivers/memory-edge-signing-keys.driver";
import { EdgeSignatureInvalidError } from "#server/errors/edge-signature-invalid.error";
import { EdgeHeaderGuard } from "#server/services/edge-header.guard";

/** What a test varies on a forwarded request. */
interface Forwarded {
  key?: string;
  scope?: string | null;
  requestId?: string;
  timestamp?: number;
  body?: string;
  sentBody?: string;
  path?: string;
}

let next = 0;

/** A request as the edge Worker forwards it, signed over `body` and sent with `sentBody` (default `body`). */
async function forwarded(options: Forwarded = {}): Promise<Request> {
  const body = options.body ?? '{"total":10}';
  const path = options.path ?? "/api/orders?page=1";
  const scope = options.scope === undefined ? "scp_01j9z3k4m5n6p7q8r9s0t1v2wa" : options.scope;
  const input = {
    scope,
    product: "commerce",
    surface: "console",
    realm: "staff",
    requestId: options.requestId ?? `req-${(next += 1)}`,
    timestamp: options.timestamp ?? Math.floor(Date.now() / 1000),
    method: "POST",
    path,
    bodyHash: createHash("sha256").update(body).digest("hex"),
  };
  const headers = new Headers({
    [EdgeHeader.Product]: input.product,
    [EdgeHeader.Surface]: input.surface,
    [EdgeHeader.Realm]: input.realm,
    [EdgeHeader.RequestId]: input.requestId,
    [EdgeHeader.Timestamp]: String(input.timestamp),
    [EdgeHeader.Signature]: await signEdgeRequest(input, options.key ?? "next"),
  });
  if (scope !== null) headers.set(EdgeHeader.Scope, scope);
  return new Request(`https://api.example.test${path}`, {
    method: "POST",
    headers,
    body: options.sentBody ?? body,
  });
}

/** A guard over memory drivers holding `secrets`. */
function guard(secrets: string[] = ["next", "previous"]) {
  const keys = new MemoryEdgeSigningKeysDriver();
  keys.secrets = secrets;
  return new EdgeHeaderGuard(keys, new MemoryEdgeNonceStoreDriver());
}

/** Whether `check` refused with `EdgeSignatureInvalidError`. */
async function refuses(subject: EdgeHeaderGuard, request: Request): Promise<boolean> {
  try {
    await subject.check(request);
    return false;
  } catch (error) {
    return isRefusal(error, EdgeSignatureInvalidError);
  }
}

describe("EdgeHeaderGuard", () => {
  it("runs before every other server check", () => {
    expect(guard().order).toBe(-100);
    expect(guard().maxAge).toBe(60);
  });

  it("lets through a request signed with either active key", async () => {
    await expect(guard().check(await forwarded({ key: "next" }))).resolves.toBeUndefined();
    await expect(guard().check(await forwarded({ key: "previous" }))).resolves.toBeUndefined();
  });

  it("lets through a platform host's request without a scope header", async () => {
    await expect(guard().check(await forwarded({ scope: null }))).resolves.toBeUndefined();
  });

  it("refuses an unknown key, and every signature when no key is active", async () => {
    expect(await refuses(guard(), await forwarded({ key: "retired" }))).toBe(true);
    expect(await refuses(guard([]), await forwarded())).toBe(true);
  });

  it("refuses a body or path the signature does not cover", async () => {
    expect(await refuses(guard(), await forwarded({ sentBody: '{"total":1}' }))).toBe(true);
    const request = await forwarded();
    const moved = new Request("https://api.example.test/api/refunds", {
      method: "POST",
      headers: request.headers,
      body: '{"total":10}',
    });
    expect(await refuses(guard(), moved)).toBe(true);
  });

  it("refuses a timestamp outside the window on either side, and accepts one on its edge", async () => {
    // Only Date is pinned: the guard reads the clock after signing, so a real second tick could move the edge.
    vi.useFakeTimers({ now: new Date("2026-10-30T09:00:00.000Z"), toFake: ["Date"] });
    try {
      const now = Math.floor(Date.now() / 1000);
      expect(await refuses(guard(), await forwarded({ timestamp: now - 60 }))).toBe(false);
      expect(await refuses(guard(), await forwarded({ timestamp: now + 60 }))).toBe(false);
      expect(await refuses(guard(), await forwarded({ timestamp: now - 61 }))).toBe(true);
      expect(await refuses(guard(), await forwarded({ timestamp: now + 61 }))).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("refuses a replayed request id", async () => {
    const subject = guard();
    await subject.check(await forwarded({ requestId: "req-replay" }));
    expect(await refuses(subject, await forwarded({ requestId: "req-replay" }))).toBe(true);
  });

  it("refuses a signed request missing an identity header", async () => {
    const request = await forwarded();
    request.headers.delete(EdgeHeader.Realm);
    expect(await refuses(guard(), request)).toBe(true);
  });

  it("lets through a request with no edge header, which authentication then decides", async () => {
    const call = new Request("https://api.example.test/api/orders", {
      method: "POST",
      headers: { authorization: "Bearer service-token" },
      body: "{}",
    });
    await expect(guard([]).check(call)).resolves.toBeUndefined();
  });

  it("refuses an identity header without a signature, even with no key active", async () => {
    for (const name of [
      EdgeHeader.Scope,
      EdgeHeader.Product,
      EdgeHeader.Surface,
      EdgeHeader.Realm,
    ]) {
      const spoofed = new Request("https://api.example.test/api/orders", {
        headers: { [name]: "x" },
      });
      expect(await refuses(guard([]), spoofed)).toBe(true);
    }
  });

  it("refuses a lone request id or timestamp without a signature", async () => {
    for (const name of [EdgeHeader.RequestId, EdgeHeader.Timestamp]) {
      const partial = new Request("https://api.example.test/api/orders", {
        headers: { [name]: "1" },
      });
      expect(await refuses(guard(), partial)).toBe(true);
    }
  });

  it("records the signed tenant of a verified request, for the call to act in", async () => {
    const request = await forwarded({ scope: "scp_01j9z3k4m5n6p7q8r9s0t1v2a1" });
    await guard().check(request);
    expect(VERIFIED_EDGE_SCOPE.get(request)).toBe("scp_01j9z3k4m5n6p7q8r9s0t1v2a1");
  });

  it("records no tenant for a platform host or a request with no edge header", async () => {
    const platform = await forwarded({ scope: null });
    await guard().check(platform);
    expect(VERIFIED_EDGE_SCOPE.has(platform)).toBe(false);
    const plain = new Request("https://api.example.test/api/orders");
    await guard().check(plain);
    expect(VERIFIED_EDGE_SCOPE.has(plain)).toBe(false);
  });

  it("records no tenant for a request it refuses, a replay included", async () => {
    const forged = await forwarded({ key: "retired" });
    expect(await refuses(guard(), forged)).toBe(true);
    expect(VERIFIED_EDGE_SCOPE.has(forged)).toBe(false);
    const subject = guard();
    await subject.check(await forwarded({ requestId: "req-twice" }));
    const replayed = await forwarded({ requestId: "req-twice" });
    expect(await refuses(subject, replayed)).toBe(true);
    expect(VERIFIED_EDGE_SCOPE.has(replayed)).toBe(false);
  });

  it("refuses a correctly signed scope that is not a tenant's public id, and records nothing", async () => {
    const request = await forwarded({ scope: "scope-1" });
    expect(await refuses(guard(), request)).toBe(true);
    expect(VERIFIED_EDGE_SCOPE.has(request)).toBe(false);
  });
});
