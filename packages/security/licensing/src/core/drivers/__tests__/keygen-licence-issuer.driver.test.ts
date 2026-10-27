/**
 * Stackra file contract:
 * Purpose: unit tests of `KeygenLicenceIssuerDriver`: it is a `LicenceIssuer`; create posts a JSON:API licence under the
 *          policy to the configured origin and account with the bearer token and returns Keygen's id; update patches
 *          expiry and metadata; check-out asks for entitlements and the TTL and returns the certificate; suspend posts
 *          the action; an unset account or token refuses with a `RangeError` before any call; a non-2xx answer, a
 *          network failure and a body without the id or certificate refuse with `LicenceIssuerUnavailableError`.
 * Boundary: test only; a stub transport stands in for Keygen.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0178 (decisions 1 to 3); ADR 0260.
 */
import { buildConfig } from "@stackra/config";
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";
import type { Transport } from "@stackra/transport";

import { IssuerConfig } from "#config/issuer.config";
import { LicensingConfig } from "#config/licensing.config";
import { KeygenLicenceIssuerDriver } from "#core/drivers/keygen-licence-issuer.driver";
import { LicenceIssuerUnavailableError } from "#core/errors/licence-issuer-unavailable.error";
import { LicenceIssuer } from "#core/ports/licence-issuer.port";

/** A transport that records requests and answers `body` with `status`. */
function keygen(body: unknown, status = 200): { send: Transport; sent: Request[] } {
  const sent: Request[] = [];
  const send: Transport = async (request) => {
    sent.push(request);
    return status === 204
      ? new Response(null, { status })
      : new Response(JSON.stringify(body), { status });
  };
  return { send, sent };
}

/** The driver over account `acme` on a self-hosted origin, with token `tok`. */
function issuer(
  send: Transport,
  account = "acme",
  productToken = "tok",
): KeygenLicenceIssuerDriver {
  return new KeygenLicenceIssuerDriver(
    buildConfig(LicensingConfig, { values: { apiUrl: "https://licences.acme.example", account } }),
    buildConfig(IssuerConfig, { values: { productToken } }),
    send,
  );
}

/** The refusal `promise` rejects with. */
async function refusal(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(
    () => undefined,
    (error: unknown) => error,
  );
}

/** A transport whose network is down. */
const unreachable: Transport = async () => {
  throw new TypeError("fetch failed");
};

const expiry = new Date("2027-01-01T00:00:00.000Z");

describe("KeygenLicenceIssuerDriver", () => {
  it("is a LicenceIssuer", () => {
    expect(issuer(keygen({}).send)).toBeInstanceOf(LicenceIssuer);
  });

  it("creates a licence under the policy and returns Keygen's id", async () => {
    const { send, sent } = keygen({ data: { id: "lic-1" } }, 201);
    const id = await issuer(send).create({
      policyId: "pol-1",
      name: "Acme",
      expiry,
      metadata: { a: 1 },
    });
    expect(id).toBe("lic-1");
    const request = sent[0] as Request;
    expect(request.method).toBe("POST");
    expect(request.url).toBe("https://licences.acme.example/v1/accounts/acme/licenses");
    expect(request.headers.get("authorization")).toBe("Bearer tok");
    expect(request.headers.get("content-type")).toBe("application/vnd.api+json");
    expect(await request.json()).toEqual({
      data: {
        type: "licenses",
        attributes: { name: "Acme", expiry: "2027-01-01T00:00:00.000Z", metadata: { a: 1 } },
        relationships: { policy: { data: { type: "policies", id: "pol-1" } } },
      },
    });
  });

  it("patches the expiry and metadata", async () => {
    const { send, sent } = keygen({ data: { id: "lic-1" } });
    await issuer(send).update("lic-1", { expiry, metadata: { b: 2 } });
    expect(sent[0]?.method).toBe("PATCH");
    expect(sent[0]?.url).toBe("https://licences.acme.example/v1/accounts/acme/licenses/lic-1");
  });

  it("checks out a file with entitlements and the TTL", async () => {
    const { send, sent } = keygen({
      data: { attributes: { certificate: "-----BEGIN LICENSE FILE-----" } },
    });
    expect(await issuer(send).checkOut("lic-1", 600)).toBe("-----BEGIN LICENSE FILE-----");
    const url = new URL((sent[0] as Request).url);
    expect(url.pathname).toBe("/v1/accounts/acme/licenses/lic-1/actions/check-out");
    expect(url.searchParams.get("include")).toBe("entitlements");
    expect(url.searchParams.get("ttl")).toBe("600");
  });

  it("suspends through the action, reading a 204 as done", async () => {
    const { send, sent } = keygen(undefined, 204);
    await issuer(send).suspend("lic-1");
    expect(sent[0]?.url).toBe(
      "https://licences.acme.example/v1/accounts/acme/licenses/lic-1/actions/suspend",
    );
  });

  it("refuses before any call when the account or the token is not set", async () => {
    const { send, sent } = keygen({});
    await expect(issuer(send, "").suspend("lic-1")).rejects.toBeInstanceOf(RangeError);
    await expect(issuer(send, "acme", "").suspend("lic-1")).rejects.toBeInstanceOf(RangeError);
    expect(sent).toHaveLength(0);
  });

  it("refuses a non-2xx answer with the status only", async () => {
    const error = await refusal(issuer(keygen({ errors: [] }, 422).send).suspend("lic-1"));
    expect(isRefusal(error, LicenceIssuerUnavailableError)).toBe(true);
    expect((error as LicenceIssuerUnavailableError).status).toBe(422);
  });

  it("refuses a network failure with status 0", async () => {
    const error = await refusal(issuer(unreachable).suspend("lic-1"));
    expect((error as LicenceIssuerUnavailableError).status).toBe(0);
  });

  it("refuses a body without the id or the certificate", async () => {
    const created = await refusal(
      issuer(keygen({ data: {} }, 201).send).create({
        policyId: "p",
        name: "n",
        expiry,
        metadata: {},
      }),
    );
    expect(isRefusal(created, LicenceIssuerUnavailableError)).toBe(true);
    const checkedOut = await refusal(
      issuer(keygen({ data: {} }).send).checkOut("lic-1", undefined),
    );
    expect(isRefusal(checkedOut, LicenceIssuerUnavailableError)).toBe(true);
  });
});
