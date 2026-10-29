/**
 * Stackra file contract:
 * Purpose: unit tests of `handleRequest`: an unknown host is 404 and reaches no origin; a forwarded request goes to the
 *          origin with the same path, query, method and body, without the client's spoofed edge headers, and passes the
 *          API's own `EdgeHeaderGuard` (the signing round trip, tenant and platform host, with a body); a tampered
 *          forwarded body fails that guard; a valid JWT bearer token is forwarded untouched; an expired one, one for
 *          another audience, one under an unknown kid and an `alg: none` one are 401 at the edge; an opaque bearer token
 *          passes to the API.
 * Boundary: test only; real Web Crypto (an RS256 key pair per run), a recording origin fetch, and the real
 *           `EdgeHeaderGuard` with its memory drivers from `@stackra/app/server`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437 (decisions 2 and 4; Enforcement); ADR 0206 (decision 8).
 */
import {
  EdgeHeaderGuard,
  MemoryEdgeNonceStoreDriver,
  MemoryEdgeSigningKeysDriver,
} from "@stackra/app/server";
import { EdgeHeader } from "@stackra/app/contracts";

import { handleRequest } from "#src/http/handle-request";
import type { EdgeDeps } from "#src/interfaces/edge-deps.interface";

const SECRET = "edge-secret";
const ISSUER = "https://auth.acme.example";
const AUDIENCE = "project-1";
const NOW = new Date();
const SECONDS = Math.floor(NOW.getTime() / 1000);

const b64 = (value: Uint8Array | object): string =>
  btoa(
    String.fromCodePoint(
      ...(value instanceof Uint8Array ? value : new TextEncoder().encode(JSON.stringify(value))),
    ),
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

const pair = await crypto.subtle.generateKey(
  {
    name: "RSASSA-PKCS1-v1_5",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
  },
  true,
  ["sign", "verify"],
);
const publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);

/** An RS256 token under `kid` (k1 by default). */
async function jwt(claims: Record<string, unknown>, kid = "k1"): Promise<string> {
  const signing = `${b64({ alg: "RS256", kid })}.${b64(claims)}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    pair.privateKey,
    new TextEncoder().encode(signing),
  );
  return `${signing}.${b64(new Uint8Array(signature))}`;
}

const claims = { iss: ISSUER, aud: AUDIENCE, sub: "u1", exp: SECONDS + 300 };

/** Deps over a recording origin; `forwarded` holds what reached it. */
function edge() {
  const forwarded: Request[] = [];
  let id = 0;
  const deps: EdgeDeps = {
    settings: {
      origin: "https://api.internal.example",
      hosts: {
        "app.acme.example": {
          product: "commerce",
          surface: "console",
          realm: "staff",
          scope: "scp_1",
        },
        "figentra.example": { product: "os", surface: "landing", realm: "public", scope: null },
      },
      issuer: ISSUER,
      audience: AUDIENCE,
      keysSeconds: 3600,
      leewaySeconds: 60,
    },
    secret: SECRET,
    keys: async (kid) => (kid === "k1" ? publicJwk : null),
    fetcher: (async (input: Request) => {
      forwarded.push(input);
      return new Response("ok");
    }) as unknown as typeof fetch,
    now: () => NOW,
    requestId: () => `req-${++id}`,
  };
  return { deps, forwarded };
}

/** The API's own guard, trusting the Worker's secret. */
function apiGuard(): EdgeHeaderGuard {
  const keys = new MemoryEdgeSigningKeysDriver();
  keys.secrets = [SECRET];
  return new EdgeHeaderGuard(keys, new MemoryEdgeNonceStoreDriver());
}

describe("handleRequest", () => {
  it("answers an unknown host 404 and forwards nothing", async () => {
    const { deps, forwarded } = edge();
    const response = await handleRequest(new Request("https://unknown.example/api/x"), deps);
    expect(response.status).toBe(404);
    expect(forwarded).toHaveLength(0);
  });

  it("forwards to the origin without spoofed edge headers, signed so the API guard accepts it", async () => {
    const { deps, forwarded } = edge();
    const inbound = new Request("https://app.acme.example/api/orders?page=2", {
      method: "POST",
      body: JSON.stringify({ total: 5 }),
      headers: {
        "content-type": "application/json",
        [EdgeHeader.Scope]: "scp_evil",
        [EdgeHeader.Realm]: "ops",
        [EdgeHeader.Signature]: "forged",
      },
    });
    expect((await handleRequest(inbound, deps)).status).toBe(200);
    const [out] = forwarded;
    if (out === undefined) throw new Error("nothing forwarded");
    expect(out.url).toBe("https://api.internal.example/api/orders?page=2");
    expect(out.method).toBe("POST");
    expect(out.headers.get("content-type")).toBe("application/json");
    expect(out.headers.get(EdgeHeader.Scope)).toBe("scp_1");
    expect(out.headers.get(EdgeHeader.Realm)).toBe("staff");
    expect(out.headers.get(EdgeHeader.Signature)).not.toBe("forged");
    expect(await out.clone().text()).toBe('{"total":5}');
    await expect(apiGuard().check(out)).resolves.toBeUndefined();
  });

  it("signs a platform host without a scope header, and the API guard accepts it", async () => {
    const { deps, forwarded } = edge();
    await handleRequest(
      new Request("https://figentra.example/api/pages", {
        headers: { [EdgeHeader.Scope]: "scp_evil" },
      }),
      deps,
    );
    const [out] = forwarded;
    if (out === undefined) throw new Error("nothing forwarded");
    expect(out.headers.get(EdgeHeader.Scope)).toBeNull();
    await expect(apiGuard().check(out)).resolves.toBeUndefined();
  });

  it("produces a signature the API guard refuses once the body is changed", async () => {
    const { deps, forwarded } = edge();
    await handleRequest(
      new Request("https://app.acme.example/api/orders", { method: "POST", body: "a" }),
      deps,
    );
    const [out] = forwarded;
    if (out === undefined) throw new Error("nothing forwarded");
    const tampered = new Request(out.url, { method: "POST", headers: out.headers, body: "b" });
    await expect(apiGuard().check(tampered)).rejects.toBeDefined();
  });

  it("forwards a valid bearer token untouched", async () => {
    const { deps, forwarded } = edge();
    const token = await jwt(claims);
    const response = await handleRequest(
      new Request("https://app.acme.example/api/me", {
        headers: { authorization: `Bearer ${token}` },
      }),
      deps,
    );
    expect(response.status).toBe(200);
    expect(forwarded[0]?.headers.get("authorization")).toBe(`Bearer ${token}`);
  });

  it.each([
    ["expired", () => jwt({ ...claims, exp: SECONDS - 120 })],
    ["for another audience", () => jwt({ ...claims, aud: "project-2" })],
    ["under an unknown kid", () => jwt(claims, "k9")],
    ["alg none", async () => `${b64({ alg: "none", kid: "k1" })}.${b64(claims)}.`],
  ])("answers a bearer token %s 401 and forwards nothing", async (_name, make) => {
    const { deps, forwarded } = edge();
    const response = await handleRequest(
      new Request("https://app.acme.example/api/me", {
        headers: { authorization: `Bearer ${await make()}` },
      }),
      deps,
    );
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toBe('Bearer error="invalid_token"');
    expect(forwarded).toHaveLength(0);
  });

  it("passes an opaque bearer token to the API", async () => {
    const { deps, forwarded } = edge();
    const response = await handleRequest(
      new Request("https://app.acme.example/api/me", {
        headers: { authorization: "Bearer stk_opaque_key" },
      }),
      deps,
    );
    expect(response.status).toBe(200);
    expect(forwarded).toHaveLength(1);
  });
});
