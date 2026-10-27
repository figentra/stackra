/**
 * Stackra file contract:
 * Purpose: unit tests of `GoogleWalletPassDriver`: it inserts the object through the Integration's API, updates it on
 *          a 409, rethrows any other refusal, and answers a save link whose JWT is signed RS256 by the service account
 *          and names the object; a missing key secret is refused by name.
 * Boundary: test only; the API is an in-test fake and the key is generated per run.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0348 (decision 5); ADR 0308 (rule 13).
 */
import type { SecretStore } from "@stackra/config/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ProviderRefusedError } from "#core/errors/provider-refused.error";
import type { IntegrationApi } from "#core/types/integration-api.type";
import type { GoogleWalletOptions } from "#node/pass/google-wallet-options.type";
import { GoogleWalletPassDriver } from "#node/pass/google-wallet-pass.driver";
import type { WalletPassRequest } from "#node/pass/wallet-pass-request.type";

/** A fresh RSA key as PKCS #8 PEM, and its public key. */
async function rsaKey(): Promise<{ pem: string; publicKey: CryptoKey }> {
  const pair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: Uint8Array.of(1, 0, 1),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const der = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  const base64 = btoa(String.fromCharCode(...der));
  return {
    pem: `-----BEGIN PRIVATE KEY-----\n${base64}\n-----END PRIVATE KEY-----`,
    publicKey: pair.publicKey,
  };
}

/** An API that records calls and refuses the first POST with `postStatus`, when given. */
function fakeApi(postStatus?: number): IntegrationApi & { calls: string[] } {
  const calls: string[] = [];
  const answer = async (method: string, path: string) => {
    calls.push(`${method} ${path}`);
    if (method === "POST" && postStatus !== undefined)
      throw ProviderRefusedError.create({ provider: "google_wallet", status: postStatus });
    return {} as never;
  };
  return {
    calls,
    get: (path) => answer("GET", path),
    delete: (path) => answer("DELETE", path),
    post: (path) => answer("POST", path),
    put: (path) => answer("PUT", path),
    patch: (path) => answer("PATCH", path),
  };
}

const secretsOf = (values: Record<string, string>): SecretStore =>
  ({ get: (name: string) => values[name] }) as unknown as SecretStore;

const request: WalletPassRequest = {
  kind: "loyalty_card",
  locale: "en",
  issuedAt: new Date("2026-10-27T10:00:00Z"),
  content: { serial: "lya_1", title: "Acme", fields: [] },
};

const options = { issuerId: "338", serviceAccountEmail: "wallet@example.iam.gserviceaccount.com" };

/** The host's subclass over `api` and `walletOptions`, built with `secrets`. */
function driverOf(
  api: IntegrationApi,
  secrets: SecretStore,
  walletOptions: GoogleWalletOptions = options,
): GoogleWalletPassDriver {
  return new (class extends GoogleWalletPassDriver {
    protected override readonly api = api;

    protected override readonly options = walletOptions;
  })(secrets);
}

/** The bytes of a base64url part. */
function decode(part: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(part.replaceAll("-", "+").replaceAll("_", "/")), (c) =>
    c.charCodeAt(0),
  );
}

/** The parts of a compact JWS. */
function partsOf(saveUrl: string): {
  header: unknown;
  claims: Record<string, unknown>;
  input: string;
  signature: Uint8Array<ArrayBuffer>;
} {
  const token = saveUrl.replace("https://pay.google.com/gp/v/save/", "");
  const [header = "", claims = "", signature = ""] = token.split(".");
  return {
    header: JSON.parse(new TextDecoder().decode(decode(header))),
    claims: JSON.parse(new TextDecoder().decode(decode(claims))) as Record<string, unknown>,
    input: `${header}.${claims}`,
    signature: decode(signature),
  };
}

describe("GoogleWalletPassDriver", () => {
  it("inserts the object and signs a save link that names it", async () => {
    const { pem, publicKey } = await rsaKey();
    const api = fakeApi();
    const driver = driverOf(api, secretsOf({ GOOGLE_WALLET_ISSUER_KEY: pem }));
    const pass = await driver.issue(request);
    expect(api.calls).toEqual(["POST /walletobjects/v1/genericObject"]);
    expect(pass).toMatchObject({
      provider: "google_wallet",
      serial: "lya_1",
      objectId: "338.lya_1",
    });
    const jws = partsOf(pass.provider === "google_wallet" ? pass.saveUrl : "");
    expect(jws.header).toEqual({ alg: "RS256", typ: "JWT" });
    expect(jws.claims).toMatchObject({
      iss: "wallet@example.iam.gserviceaccount.com",
      aud: "google",
      typ: "savetowallet",
      origins: [],
      payload: { genericObjects: [{ id: "338.lya_1" }] },
      iat: 1_793_095_200,
      exp: 1_793_095_200 + 86_400,
    });
    expect(
      await crypto.subtle.verify(
        "RSASSA-PKCS1-v1_5",
        publicKey,
        jws.signature,
        new TextEncoder().encode(jws.input),
      ),
    ).toBe(true);
  });

  it("updates the object when it exists", async () => {
    const { pem } = await rsaKey();
    const api = fakeApi(409);
    await driverOf(api, secretsOf({ GOOGLE_WALLET_ISSUER_KEY: pem })).issue(request);
    expect(api.calls).toEqual([
      "POST /walletobjects/v1/genericObject",
      "PUT /walletobjects/v1/genericObject/338.lya_1",
    ]);
  });

  it("rethrows any other refusal", async () => {
    const driver = driverOf(fakeApi(400), secretsOf({}));
    await expect(driver.issue(request)).rejects.toSatisfy((error) =>
      ProviderRefusedError.is(error, { status: 400 }),
    );
  });

  it("refuses a missing key secret by name", async () => {
    const driver = driverOf(fakeApi(), secretsOf({}), {
      ...options,
      keySecret: "MY_KEY",
    });
    await expect(driver.issue(request)).rejects.toThrow(/MY_KEY/);
  });
});
