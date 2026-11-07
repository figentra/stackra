/**
 * Stackra file contract:
 * Purpose: unit tests of `handleEnvSyncRequest`: a body signed the way Infisical signs it (HMAC-SHA256 of the JSON
 *          body, `t` = the body's `timestamp`) dispatches the routed repository's env-sync.yml with the mapped
 *          environment and path; a bad, stale, unbound or missing signature (or secret) is 401; a value key is 400;
 *          another event is 200 with no dispatch; an unknown project is 404; an unknown slug is 400; a GitHub refusal
 *          is 502; other routes 404 and 405.
 * Boundary: runs the handler in Node with a stand-in fetch; no network, no workerd.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0173 (amendment of 2026-11-04, decision 6).
 */
import { createHmac, generateKeyPairSync } from "node:crypto";

import type { EnvSyncEnv } from "#src/interfaces";
import { handleEnvSyncRequest } from "#src/webhook/handle-request";

const URL_BASE = "https://env-sync.example.test";
const SECRET = "webhook-key";
const APP_KEY = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs1", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
}).privateKey;

let env: EnvSyncEnv;
/** The dispatch calls only; the App's installation lookup and token mint answer as GitHub does. */
let calls: { url: string; init: RequestInit }[];
let status: number;

const fetcher: typeof fetch = async (input, init) => {
  const url = String(input);
  if (url.endsWith("/installation")) return Response.json({ id: 42 });
  if (url.endsWith("/access_tokens")) return Response.json({ token: "ghs-token" }, { status: 201 });
  calls.push({ url, init: init ?? {} });
  return new Response(null, { status });
};

beforeEach(() => {
  calls = [];
  status = 204;
  env = {
    INFISICAL_WEBHOOK_SECRET: SECRET,
    STACKRA_BOT_APP_ID: "123",
    STACKRA_BOT_PRIVATE_KEY: APP_KEY,
    ENV_SYNC_ROUTES: JSON.stringify({ "proj-1": "figentra/pay" }),
  };
});

const payload = (
  environment = "dev",
  extra: Record<string, unknown> = {},
  timestamp = Date.now(),
  event = "secrets.modified",
) =>
  JSON.stringify({
    event,
    project: { workspaceId: "proj-1", environment, secretPath: "/runtime/api", ...extra },
    timestamp,
  });

/** Infisical's header: `t=<the body's timestamp>;<hex HMAC-SHA256 of the body>`. */
const sign = (
  body: string,
  stamp = String((JSON.parse(body) as { timestamp: number }).timestamp),
  secret = SECRET,
) => `t=${stamp};${createHmac("sha256", secret).update(body).digest("hex")}`;

/** POSTs `body`; a `null` signature sends no header. */
const post = (body: string, signature: string | null = sign(body), path = "/infisical") =>
  handleEnvSyncRequest(
    new Request(`${URL_BASE}${path}`, {
      method: "POST",
      body,
      headers: signature === null ? {} : { "x-infisical-signature": signature },
    }),
    env,
    fetcher,
  );

describe("handleEnvSyncRequest", () => {
  it("dispatches the routed repository's env-sync.yml on a good signature", async () => {
    const response = await post(payload());
    expect(response.status).toBe(202);
    expect(calls).toHaveLength(1);
    const [call] = calls;
    expect(call?.url).toBe(
      "https://api.github.com/repos/figentra/pay/actions/workflows/env-sync.yml/dispatches",
    );
    expect(call?.init.method).toBe("POST");
    expect(JSON.parse(String(call?.init.body))).toEqual({
      ref: "main",
      inputs: { environment: "dev", path: "/runtime/api" },
    });
    const headers = new Headers(call?.init.headers);
    expect(headers.get("authorization")).toBe("Bearer ghs-token");
    expect(headers.get("accept")).toBe("application/vnd.github+json");
    expect(headers.get("user-agent")).toBe("stackra-env-sync");
  });

  it("refuses a header timestamp that is not the signed body's with 401", async () => {
    const body = payload();
    expect((await post(body, sign(body, String(Date.now() + 1000)))).status).toBe(401);
  });

  it("acknowledges another event with 200 and dispatches nothing", async () => {
    const response = await post(payload("dev", {}, Date.now(), "secrets.rotation-failed"));
    expect(response.status).toBe(200);
    expect(calls).toHaveLength(0);
  });

  it.each([
    ["prod", "production"],
    ["staging", "staging"],
  ])("maps %s to %s", async (slug, environment) => {
    expect((await post(payload(slug))).status).toBe(202);
    expect(JSON.parse(String(calls[0]?.init.body))).toMatchObject({ inputs: { environment } });
  });

  it.each([
    ["a wrong key", (body: string) => sign(body, String(Date.now()), "other-key")],
    ["a malformed header", () => "sha256=abc"],
    ["no header", () => null],
  ])("refuses %s with 401", async (_, signatureOf) => {
    const body = payload();
    const response = await post(body, signatureOf(body));
    expect(response.status).toBe(401);
    expect(calls).toHaveLength(0);
  });

  it("refuses a stale body with 401", async () => {
    const body = payload("dev", {}, Date.now() - 6 * 60 * 1000);
    const response = await post(body);
    expect(response.status).toBe(401);
    expect(calls).toHaveLength(0);
  });

  it("refuses a signature over another body with 401", async () => {
    expect((await post(payload("prod"), sign(payload("dev")))).status).toBe(401);
  });

  it("fails closed with 401 when the webhook secret is missing", async () => {
    env = { ...env, INFISICAL_WEBHOOK_SECRET: undefined };
    expect((await post(payload())).status).toBe(401);
    expect(calls).toHaveLength(0);
  });

  it.each([{ value: "x" }, { secretValue: "x" }, { secrets: [] }])(
    "refuses a payload carrying %j with 400",
    async (extra) => {
      const response = await post(payload("dev", extra));
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ error: { code: "value_refused" } });
      expect(calls).toHaveLength(0);
    },
  );

  it("refuses a value key nested in an array with 400", async () => {
    const body = JSON.stringify({
      event: "secrets.modified",
      project: { workspaceId: "proj-1", environment: "dev", secretPath: "/" },
      changes: [{ key: "A", Value: "x" }],
      timestamp: Date.now(),
    });
    expect((await post(body)).status).toBe(400);
  });

  it("answers 404 for an unknown project", async () => {
    env = { ...env, ENV_SYNC_ROUTES: "{}" };
    expect((await post(payload())).status).toBe(404);
    expect(calls).toHaveLength(0);
  });

  it("answers 400 for an unknown environment slug", async () => {
    expect((await post(payload("qa"))).status).toBe(400);
  });

  it("answers 503 when the routes are not a JSON object of repositories", async () => {
    env = { ...env, ENV_SYNC_ROUTES: JSON.stringify({ "proj-1": "../../evil" }) };
    expect((await post(payload())).status).toBe(503);
  });

  it("answers 503 and dispatches nothing when the App's key is not configured", async () => {
    env = { ...env, STACKRA_BOT_PRIVATE_KEY: undefined };
    const response = await post(payload());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: "sync_misconfigured" } });
    expect(calls).toHaveLength(0);
  });

  it("answers 502 when GitHub refuses the dispatch", async () => {
    status = 404;
    expect((await post(payload())).status).toBe(502);
  });

  it("answers GET /readyz with 200 when every setting is there", async () => {
    const response = await handleEnvSyncRequest(new Request(`${URL_BASE}/readyz`), env, fetcher);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ready: true });
    expect(calls).toHaveLength(0);
  });

  it("answers GET /readyz with 503 naming each unset or unreadable setting, never a value", async () => {
    env = {
      ENV_SYNC_ROUTES: "not json",
      STACKRA_BOT_APP_ID: " ",
      STACKRA_BOT_PRIVATE_KEY: "not a key",
    };
    const response = await handleEnvSyncRequest(new Request(`${URL_BASE}/readyz`), env, fetcher);
    expect(response.status).toBe(503);
    const body = (await response.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe("not_ready");
    for (const name of [
      "INFISICAL_WEBHOOK_SECRET",
      "STACKRA_BOT_APP_ID",
      "STACKRA_BOT_PRIVATE_KEY",
      "ENV_SYNC_ROUTES",
    ])
      expect(body.error.message).toContain(name);
    expect(body.error.message).not.toContain("not a key");
  });

  it("answers 405 for a POST to /readyz", async () => {
    const response = await handleEnvSyncRequest(
      new Request(`${URL_BASE}/readyz`, { method: "POST" }),
      env,
      fetcher,
    );
    expect(response.status).toBe(405);
  });

  it("answers 404 off the route and 405 for another method", async () => {
    expect((await post(payload(), undefined, "/other")).status).toBe(404);
    const response = await handleEnvSyncRequest(new Request(`${URL_BASE}/infisical`), env, fetcher);
    expect(response.status).toBe(405);
  });
});
