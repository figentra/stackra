/**
 * Stackra file contract:
 * Purpose: unit tests of `checkLicenceKey`: posts Keygen's `validate-key` action with the key in the JSON:API body
 *          (never the URL), scopes by fingerprint when given, honours a self-hosted base URL, returns the verdict, and
 *          refuses with `LicenceCheckUnavailableError` for a non-200 status or a body without `meta.valid`.
 * Boundary: test only; a stub transport stands in for Keygen.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0178 (decision 5).
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";
import type { Transport } from "@stackra/transport";

import { LicenceCheckUnavailableError } from "#core/errors/licence-check-unavailable.error";
import { checkLicenceKey } from "#core/functions/check-licence-key.function";

/** A transport that records the request and answers with `body` and `status`. */
function keygen(body: unknown, status = 200): { send: Transport; sent: Request[] } {
  const sent: Request[] = [];
  const send: Transport = async (request) => {
    sent.push(request);
    return new Response(JSON.stringify(body), { status });
  };
  return { send, sent };
}

/** A transport that answers 200 with a body that is not JSON. */
const htmlPage: Transport = async () => new Response("<html>", { status: 200 });

describe("checkLicenceKey", () => {
  it("posts the validate-key action and returns the verdict", async () => {
    const { send, sent } = keygen({ meta: { valid: true, code: "VALID", detail: "is valid" } });
    const check = await checkLicenceKey({ account: "acme", licenceKey: "KEY-1", transport: send });
    expect(check).toEqual({ valid: true, code: "VALID", detail: "is valid" });
    const request = sent[0] as Request;
    expect(request.method).toBe("POST");
    expect(request.url).toBe(
      "https://api.keygen.sh/v1/accounts/acme/licenses/actions/validate-key",
    );
    expect(request.headers.get("content-type")).toBe("application/vnd.api+json");
    expect(request.url).not.toContain("KEY-1");
    expect(await request.json()).toEqual({ meta: { key: "KEY-1" } });
  });

  it("scopes the check by fingerprint and honours a self-hosted base URL", async () => {
    const { send, sent } = keygen({
      meta: {
        valid: false,
        code: "FINGERPRINT_SCOPE_MISMATCH",
        detail: "fingerprint is not activated",
      },
    });
    const check = await checkLicenceKey({
      account: "acme",
      licenceKey: "KEY-1",
      fingerprint: "machine-1",
      transport: send,
      baseUrl: "https://keygen.acme.test",
    });
    expect(check.valid).toBe(false);
    expect(check.code).toBe("FINGERPRINT_SCOPE_MISMATCH");
    const request = sent[0] as Request;
    expect(request.url.startsWith("https://keygen.acme.test/v1/accounts/acme/")).toBe(true);
    expect(await request.json()).toEqual({
      meta: { key: "KEY-1", scope: { fingerprint: "machine-1" } },
    });
  });

  it("reads a verdict without code or detail as empty text", async () => {
    const { send } = keygen({ meta: { valid: true } });
    expect(await checkLicenceKey({ account: "acme", licenceKey: "K", transport: send })).toEqual({
      valid: true,
      code: "",
      detail: "",
    });
  });

  it("refuses a status other than 200", async () => {
    const { send } = keygen({ errors: [] }, 503);
    const error: unknown = await checkLicenceKey({
      account: "acme",
      licenceKey: "K",
      transport: send,
    }).catch((caught: unknown) => caught);
    expect(isRefusal(error, LicenceCheckUnavailableError)).toBe(true);
    expect((error as LicenceCheckUnavailableError).status).toBe(503);
  });

  it("refuses a body without meta.valid", async () => {
    const { send } = keygen({ data: null });
    await expect(
      checkLicenceKey({ account: "acme", licenceKey: "K", transport: send }),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, LicenceCheckUnavailableError));
  });

  it("refuses a body that is not JSON", async () => {
    await expect(
      checkLicenceKey({ account: "acme", licenceKey: "K", transport: htmlPage }),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, LicenceCheckUnavailableError));
  });
});
