/**
 * Stackra file contract:
 * Purpose: unit tests of `KeygenLicenceVerifierDriver`: it is a `LicenceVerifier`; the online check posts to the
 *          configured origin and account with the fingerprint scope; an unset account or verify key refuses with a
 *          `RangeError` before any call; a file is verified with the configured key.
 * Boundary: test only; a stub transport stands in for Keygen and the shared fixture supplies a signed file.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0178 (decisions 1, 2 and 5); owner round 3 #37.
 */
import { buildConfig } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";
import type { Transport } from "@stackra/transport";

import { LicensingConfig } from "#config/licensing.config";
import { KeygenLicenceVerifierDriver } from "#core/drivers/keygen-licence-verifier.driver";
import { LicenceVerifier } from "#core/ports/licence-verifier.port";

/** A transport that records requests and answers a valid verdict. */
function keygen(): { send: Transport; sent: Request[] } {
  const sent: Request[] = [];
  const send: Transport = async (request) => {
    sent.push(request);
    return new Response(
      JSON.stringify({ meta: { valid: true, code: "VALID", detail: "is valid" } }),
    );
  };
  return { send, sent };
}

describe("KeygenLicenceVerifierDriver", () => {
  it("is a LicenceVerifier", () => {
    expect(new KeygenLicenceVerifierDriver(buildConfig(LicensingConfig))).toBeInstanceOf(
      LicenceVerifier,
    );
  });

  it("checks a key against the configured origin and account", async () => {
    const { send, sent } = keygen();
    const config = buildConfig(LicensingConfig, {
      values: { apiUrl: "https://licences.acme.example", account: "acme" },
    });
    const check = await new KeygenLicenceVerifierDriver(config, send).check("KEY-1", "fp-1");
    expect(check).toEqual({ valid: true, code: "VALID", detail: "is valid" });
    expect(sent[0]?.url).toBe(
      "https://licences.acme.example/v1/accounts/acme/licenses/actions/validate-key",
    );
    expect(await sent[0]?.json()).toEqual({
      meta: { key: "KEY-1", scope: { fingerprint: "fp-1" } },
    });
  });

  it("refuses before any call when the account or the key is not set", async () => {
    const { send, sent } = keygen();
    const verifier = new KeygenLicenceVerifierDriver(buildConfig(LicensingConfig), send);
    await expect(verifier.check("KEY-1")).rejects.toBeInstanceOf(RangeError);
    await expect(verifier.verify("-----BEGIN LICENSE FILE-----")).rejects.toBeInstanceOf(
      RangeError,
    );
    expect(sent).toHaveLength(0);
  });
});
