/**
 * Stackra file contract:
 * Purpose: `TurnstileCaptchaVerifierDriver` (`turnstile`), the `CaptchaVerifier` driver that checks a token with
 *          Cloudflare Turnstile's siteverify endpoint from the Worker, with the secret `TURNSTILE_SECRET_KEY`.
 * Boundary: the secret is read by name from the `SecretStore` the runtime binds (runway syncs it from Infisical) and
 *           sent only to Cloudflare; it is never logged or returned. An empty or over-long token fails without a
 *           call. A missing secret, a failed call or an answer with no verdict throws, so it is never mistaken for a
 *           failed captcha. Each call waits at most five seconds.
 * Runtime: worker
 * Governing contract: ADR 0173 (secrets by name); ADR 0294 (decision 17: dependencies by type); ADR 0127 2026-10-24
 *                     note (`./worker` entry).
 */
import { SecretStore } from "@stackra/config/contracts";
import { Driver } from "@stackra/container";

import { CaptchaVerifier } from "#contracts/ports/captcha-verifier.port";

/** Cloudflare's verification endpoint. */
const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** The longest token Turnstile issues. */
const MAX_TOKEN = 2048;

/** How long one verification may take, in milliseconds. */
const TIMEOUT = 5000;

/**
 * Verifies captcha tokens with Cloudflare Turnstile.
 *
 * @example
 * // generated wiring, web worker
 * { port: CaptchaVerifier, candidates: { turnstile: () => import("@stackra/platform/worker").then((m) => m.TurnstileCaptchaVerifierDriver) } }
 */
export class TurnstileCaptchaVerifierDriver extends Driver(CaptchaVerifier) {
  /** Where `TURNSTILE_SECRET_KEY` is read from. */
  private readonly secrets: SecretStore;

  /** @param secrets - the runtime's secret store. */
  constructor(secrets: SecretStore) {
    super();
    this.secrets = secrets;
  }

  /**
   * Turnstile's verdict on `token`.
   *
   * @throws Error when the secret is not bound, Cloudflare cannot be reached, or it answers without a verdict.
   */
  async verify(token: string, remoteIp?: string): Promise<boolean> {
    if (token.length === 0 || token.length > MAX_TOKEN) return false;
    const secret = this.secrets.get("TURNSTILE_SECRET_KEY");
    if (secret === undefined) throw new Error("TURNSTILE_SECRET_KEY is not bound");
    const body = new FormData();
    body.set("secret", secret);
    body.set("response", token);
    if (remoteIp !== undefined) body.set("remoteip", remoteIp);
    const response = await fetch(SITEVERIFY, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!response.ok) throw new Error(`Turnstile answered HTTP ${response.status}`);
    const verdict: unknown = await response.json();
    const success = (verdict as { success?: unknown } | null)?.success;
    if (typeof success !== "boolean") throw new Error("Turnstile answered without a verdict");
    return success;
  }
}
