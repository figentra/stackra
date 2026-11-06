/**
 * Stackra file contract:
 * Purpose: unit tests of `installationToken` and `pkcs8Of`: a PKCS#1 key (GitHub's format) and a PKCS#8 key both sign
 *          an RS256 App JWT that the public key verifies, with `iss` the App id and a 10-minute window; the token is
 *          asked for the routed repository alone with `actions: write`; a missing id or key, or an unreadable key, is
 *          503; an App not installed or a refused token is 502.
 * Boundary: runs in Node with a stand-in fetch and keys generated per run; no network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2133.
 */
import { createVerify, generateKeyPairSync } from "node:crypto";

import type { EnvSyncEnv } from "#src/interfaces";
import { installationToken } from "#src/webhook/installation-token";
import { pkcs8Of } from "#src/webhook/pkcs8-of";

const NOW = 1_800_000_000;

const pair = (type: "pkcs1" | "pkcs8") =>
  generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type, format: "pem" },
  });

const PKCS1 = pair("pkcs1");

let calls: { url: string; init: RequestInit }[];
let installStatus: number;
let tokenStatus: number;

const fetcher: typeof fetch = async (input, init) => {
  const url = String(input);
  calls.push({ url, init: init ?? {} });
  if (url.endsWith("/installation")) return Response.json({ id: 42 }, { status: installStatus });
  return Response.json({ token: "ghs_installation" }, { status: tokenStatus });
};

const env = (key: string = PKCS1.privateKey, appId: string | undefined = "123"): EnvSyncEnv => ({
  STACKRA_BOT_APP_ID: appId,
  STACKRA_BOT_PRIVATE_KEY: key,
});

/** The JWT the installation lookup carried. */
const jwtOf = (call: { init: RequestInit } | undefined): string =>
  (new Headers(call?.init.headers).get("authorization") ?? "").replace(/^Bearer /, "");

const verified = (jwt: string, publicKey: string): boolean => {
  const [head, claims, signature] = jwt.split(".");
  return createVerify("RSA-SHA256")
    .update(`${head}.${claims}`)
    .verify(publicKey, Buffer.from(signature ?? "", "base64url"));
};

beforeEach(() => {
  calls = [];
  installStatus = 200;
  tokenStatus = 201;
});

describe("installationToken", () => {
  it.each([
    ["PKCS#1", PKCS1],
    ["PKCS#8", pair("pkcs8")],
  ])(
    "signs the App JWT with a %s key and mints a token for the routed repository",
    async (_, keys) => {
      const got = await installationToken("figentra/pay", env(keys.privateKey), fetcher, NOW);
      expect(got).toEqual({ token: "ghs_installation" });
      expect(calls.map((c) => c.url)).toEqual([
        "https://api.github.com/repos/figentra/pay/installation",
        "https://api.github.com/app/installations/42/access_tokens",
      ]);
      const jwt = jwtOf(calls[0]);
      expect(verified(jwt, keys.publicKey)).toBe(true);
      expect(JSON.parse(Buffer.from(jwt.split(".")[1] ?? "", "base64url").toString())).toEqual({
        iat: NOW - 60,
        exp: NOW + 540,
        iss: "123",
      });
      expect(calls[1]?.init.method).toBe("POST");
      expect(JSON.parse(String(calls[1]?.init.body))).toEqual({
        repositories: ["pay"],
        permissions: { actions: "write" },
      });
    },
  );

  it("reads a key stored on one line with \\n escapes", async () => {
    const oneLine = PKCS1.privateKey.replaceAll("\n", "\\n");
    expect(await installationToken("figentra/pay", env(oneLine), fetcher, NOW)).toEqual({
      token: "ghs_installation",
    });
  });

  it.each([
    // An explicit object: `env(key, undefined)` would fall back to the default App id.
    ["no App id", { ...env(), STACKRA_BOT_APP_ID: undefined }],
    ["an empty App id", env(PKCS1.privateKey, " ")],
    ["no key", { STACKRA_BOT_APP_ID: "123" }],
    ["a key that is not PEM", env("not a key")],
    [
      "a PEM that is not a key",
      // The PEM markers are built here so the secret scan sees no key-shaped literal.
      env(["BEGIN", "END"].map((m) => `-----${m} PRIVATE KEY-----`).join("\nAAAA\n")),
    ],
  ])("answers 503 for %s, calling nothing", async (_, settings) => {
    expect(await installationToken("figentra/pay", settings, fetcher, NOW)).toMatchObject({
      status: 503,
      code: "sync_misconfigured",
    });
    expect(calls).toHaveLength(0);
  });

  it("answers 502 when the App is not installed on the repository", async () => {
    installStatus = 404;
    expect(await installationToken("figentra/pay", env(), fetcher, NOW)).toMatchObject({
      status: 502,
      code: "app_not_installed",
    });
    expect(calls).toHaveLength(1);
  });

  it("answers 502 when GitHub refuses the token", async () => {
    tokenStatus = 422;
    expect(await installationToken("figentra/pay", env(), fetcher, NOW)).toMatchObject({
      status: 502,
      code: "token_refused",
    });
  });
});

describe("pkcs8Of", () => {
  it("returns a PKCS#8 key unchanged and wraps a PKCS#1 key", () => {
    const p8 = pair("pkcs8").privateKey;
    const body = p8.replaceAll(/-----[^-]+-----/g, "").replaceAll(/\s/g, "");
    expect(Buffer.from(pkcs8Of(p8) ?? []).toString("base64")).toBe(body);
    expect(pkcs8Of(PKCS1.privateKey)?.[0]).toBe(0x30);
  });
});
