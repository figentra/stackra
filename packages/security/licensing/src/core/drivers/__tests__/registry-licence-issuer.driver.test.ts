/**
 * Stackra file contract:
 * Purpose: unit tests of `RegistryLicenceIssuerDriver`: it is a `LicenceIssuer`; `apply` maps every
 *          `RegistryLicenceCommand` to its method and path under the configured registry origin, with the issuer
 *          bearer token and the Idempotency-Key, and answers the licence; `create`, `update` and `suspend` map onto
 *          issue, renew (and set grants) and suspend; `checkOut` and a draft without `holderRef` or `grants` refuse
 *          with a `RangeError`; an unset issuer token refuses before any call; a non-2xx answer, a network failure
 *          and a body without a licence id refuse with `LicenceIssuerUnavailableError`.
 * Boundary: test only; a stub transport stands in for the registry Worker.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decisions 14 and 15); ADR 0260.
 */
import { buildConfig, MemorySecretStoreDriver } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";
import type { Transport } from "@stackra/transport";

import { IssuerConfig } from "#config/issuer.config";
import type { RegistryLicence } from "#contracts/types/registry-licence.type";
import type { RegistryLicenceCommand } from "#contracts/types/registry-licence-command.type";
import { RegistryLicenceIssuerDriver } from "#core/drivers/registry-licence-issuer.driver";
import { LicenceIssuerUnavailableError } from "#core/errors/licence-issuer-unavailable.error";
import { LicenceIssuer } from "#core/ports/licence-issuer.port";

const ORIGIN = "https://npm.registry.example";

const LICENCE: RegistryLicence = {
  id: "lic_1",
  holderRef: "acc_1",
  grants: [{ scope: "@stackra-pro", names: "*" }],
  notBefore: null,
  expiresAt: "2027-11-01T00:00:00.000Z",
  status: "active",
  tokens: [],
  issuedToken: null,
};

/** A transport that records every request and answers `body` with `status`. */
function registry(body: unknown = LICENCE, status = 200): { send: Transport; sent: Request[] } {
  const sent: Request[] = [];
  const send: Transport = async (request) => {
    sent.push(request);
    return new Response(JSON.stringify(body), { status });
  };
  return { send, sent };
}

/** The driver over `ORIGIN` with issuer token `tok` from the secret store. */
function issuer(send: Transport, issuerToken = "tok"): RegistryLicenceIssuerDriver {
  return new RegistryLicenceIssuerDriver(
    buildConfig(IssuerConfig, {
      values: { registryUrl: ORIGIN },
      secrets: new MemorySecretStoreDriver().set("REGISTRY_ISSUER_TOKEN", issuerToken),
    }),
    send,
  );
}

/** The rejection of `promise`. */
const refusal = (promise: Promise<unknown>): Promise<unknown> =>
  promise.then(
    () => undefined,
    (error: unknown) => error,
  );

const expiry = new Date("2027-11-01T00:00:00.000Z");

describe("RegistryLicenceIssuerDriver", () => {
  it("is a LicenceIssuer", () => {
    expect(issuer(registry().send)).toBeInstanceOf(LicenceIssuer);
  });

  it.each<[RegistryLicenceCommand, string, string, unknown]>([
    [
      {
        action: "issue",
        idempotencyKey: "evt-1",
        holderRef: "acc_1",
        grants: [{ scope: "@stackra-pro", names: "*" }],
        notBefore: null,
        expiresAt: "2027-11-01T00:00:00.000Z",
        tokenLabel: "ci",
      },
      "POST",
      "/-/stackra/v1/licences",
      {
        holderRef: "acc_1",
        grants: [{ scope: "@stackra-pro", names: "*" }],
        notBefore: null,
        expiresAt: "2027-11-01T00:00:00.000Z",
        tokenLabel: "ci",
      },
    ],
    [
      { action: "renew", idempotencyKey: "evt-1", licenceId: "lic_1", expiresAt: null },
      "PATCH",
      "/-/stackra/v1/licences/lic_1",
      { expiresAt: null },
    ],
    [
      { action: "setGrants", idempotencyKey: "evt-1", licenceId: "lic_1", grants: [] },
      "PATCH",
      "/-/stackra/v1/licences/lic_1",
      { grants: [] },
    ],
    [
      { action: "suspend", idempotencyKey: "evt-1", licenceId: "lic_1" },
      "POST",
      "/-/stackra/v1/licences/lic_1/suspend",
      null,
    ],
    [
      { action: "resume", idempotencyKey: "evt-1", licenceId: "lic_1" },
      "POST",
      "/-/stackra/v1/licences/lic_1/resume",
      null,
    ],
    [
      { action: "revoke", idempotencyKey: "evt-1", licenceId: "lic_1" },
      "POST",
      "/-/stackra/v1/licences/lic_1/revoke",
      null,
    ],
    [
      { action: "addToken", idempotencyKey: "evt-1", licenceId: "lic_1", tokenLabel: "mac" },
      "POST",
      "/-/stackra/v1/licences/lic_1/tokens",
      { label: "mac" },
    ],
    [
      { action: "revokeToken", idempotencyKey: "evt-1", licenceId: "lic_1", tokenId: "tok_9" },
      "DELETE",
      "/-/stackra/v1/licences/lic_1/tokens/tok_9",
      null,
    ],
  ])("sends %o", async (command, method, path, body) => {
    const { send, sent } = registry();
    expect(await issuer(send).apply(command)).toEqual(LICENCE);
    const request = sent[0] as Request;
    expect(request.method).toBe(method);
    expect(request.url).toBe(`${ORIGIN}${path}`);
    expect(request.headers.get("authorization")).toBe("Bearer tok");
    expect(request.headers.get("idempotency-key")).toBe("evt-1");
    expect(body === null ? await request.text() : await request.json()).toEqual(
      body === null ? "" : body,
    );
  });

  it("creates through issue, without a token, and returns the id", async () => {
    const { send, sent } = registry();
    const id = await issuer(send).create({
      policyId: "unused",
      name: "Acme",
      expiry,
      metadata: {
        holderRef: "acc_1",
        grants: [{ scope: "@stackra-pro", names: ["@stackra-pro/sync"] }],
        idempotencyKey: "evt-7",
      },
    });
    expect(id).toBe("lic_1");
    const request = sent[0] as Request;
    expect(request.headers.get("idempotency-key")).toBe("evt-7:issue");
    expect(await request.json()).toEqual({
      holderRef: "acc_1",
      grants: [{ scope: "@stackra-pro", names: ["@stackra-pro/sync"] }],
      notBefore: null,
      expiresAt: "2027-11-01T00:00:00.000Z",
      tokenLabel: null,
    });
  });

  it("updates through renew, then set grants when the metadata carries them", async () => {
    const { send, sent } = registry();
    await issuer(send).update("lic_1", { expiry, metadata: {} });
    await issuer(send).update("lic_1", {
      expiry,
      metadata: { grants: [{ scope: "@stackra-pro", names: "*" }] },
    });
    expect(sent.map((request) => request.method)).toEqual(["PATCH", "PATCH", "PATCH"]);
    expect(await (sent[2] as Request).json()).toEqual({
      grants: [{ scope: "@stackra-pro", names: "*" }],
    });
  });

  it("suspends", async () => {
    const { send, sent } = registry();
    await issuer(send).suspend("lic_1");
    expect((sent[0] as Request).url).toBe(`${ORIGIN}/-/stackra/v1/licences/lic_1/suspend`);
  });

  it("refuses a draft without holderRef or grants, and check-out", async () => {
    const driver = issuer(registry().send);
    expect(
      await refusal(driver.create({ policyId: "p", name: "n", expiry, metadata: { grants: [] } })),
    ).toBeInstanceOf(RangeError);
    expect(
      await refusal(
        driver.create({ policyId: "p", name: "n", expiry, metadata: { holderRef: "acc_1" } }),
      ),
    ).toBeInstanceOf(RangeError);
    expect(await refusal(driver.checkOut("lic_1", undefined))).toBeInstanceOf(RangeError);
  });

  it("refuses before any call when the issuer token is unset", async () => {
    const { send, sent } = registry();
    expect(await refusal(issuer(send, "").suspend("lic_1"))).toBeInstanceOf(RangeError);
    expect(sent).toEqual([]);
  });

  it("refuses a non-2xx answer, a network failure and a body without an id", async () => {
    const failed = await refusal(issuer(registry({ error: "x" }, 409).send).suspend("lic_1"));
    expect(failed).toBeInstanceOf(LicenceIssuerUnavailableError);
    expect((failed as LicenceIssuerUnavailableError).status).toBe(409);
    const down: Transport = async () => {
      throw new TypeError("fetch failed");
    };
    expect(await refusal(issuer(down).suspend("lic_1"))).toBeInstanceOf(
      LicenceIssuerUnavailableError,
    );
    expect(await refusal(issuer(registry({}).send).suspend("lic_1"))).toBeInstanceOf(
      LicenceIssuerUnavailableError,
    );
  });
});
