/**
 * Stackra file contract:
 * Purpose: unit tests of `TurnstileCaptchaVerifierDriver`: it posts the token, secret and address to siteverify and
 *          answers its verdict; an empty or over-long token fails without a call; a missing secret, an HTTP error or
 *          an answer without a verdict throws.
 * Boundary: test only; `fetch` is stubbed and the secret store answers a test value by name.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0173 (secrets by name).
 */
import { SecretStore } from "@stackra/config";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CaptchaVerifier } from "#contracts/ports/captcha-verifier.port";
import { TurnstileCaptchaVerifierDriver } from "#worker/drivers/turnstile-captcha-verifier.driver";

/** A secret store answering from `values`. */
function storeOf(values: Readonly<Record<string, string>>): SecretStore {
  return Object.assign(Object.create(SecretStore.prototype) as SecretStore, {
    get: (name: string) => values[name],
  });
}

/** Stubs `fetch` with one JSON answer and returns the mock. */
function answer(body: unknown, status = 200) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TurnstileCaptchaVerifierDriver", () => {
  const secrets = storeOf({ TURNSTILE_SECRET_KEY: "test-turnstile-secret" });

  it("answers siteverify's verdict for the token, secret and address", async () => {
    const fetchMock = answer({ success: true });
    const captcha = new TurnstileCaptchaVerifierDriver(secrets);
    expect(captcha).toBeInstanceOf(CaptchaVerifier);
    expect(await captcha.verify("token-1", "203.0.113.7")).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    const form = init.body as FormData;
    expect(form.get("response")).toBe("token-1");
    expect(form.get("secret")).toBe("test-turnstile-secret");
    expect(form.get("remoteip")).toBe("203.0.113.7");
    answer({ success: false, "error-codes": ["invalid-input-response"] });
    expect(await captcha.verify("token-2")).toBe(false);
  });

  it("fails an empty or over-long token without a call", async () => {
    const fetchMock = answer({ success: true });
    const captcha = new TurnstileCaptchaVerifierDriver(secrets);
    expect(await captcha.verify("")).toBe(false);
    expect(await captcha.verify("x".repeat(2049))).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws on a missing secret, an HTTP error and an answer without a verdict", async () => {
    await expect(new TurnstileCaptchaVerifierDriver(storeOf({})).verify("t")).rejects.toThrow(
      /TURNSTILE_SECRET_KEY/,
    );
    answer({}, 500);
    await expect(new TurnstileCaptchaVerifierDriver(secrets).verify("t")).rejects.toThrow(
      /HTTP 500/,
    );
    answer({ ok: 1 });
    await expect(new TurnstileCaptchaVerifierDriver(secrets).verify("t")).rejects.toThrow(
      /verdict/,
    );
  });
});
