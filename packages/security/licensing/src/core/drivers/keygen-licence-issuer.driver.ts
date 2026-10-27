/**
 * Stackra file contract:
 * Purpose: `KeygenLicenceIssuerDriver`, the `LicenceIssuer` over Keygen's licence API: create a licence under a policy,
 *          patch its expiry and metadata, check out a signed file with its entitlements, and suspend it.
 * Boundary: named `keygen` by its file prefix; `IssuerConfig.driver` picks it. The origin and account come from
 *           `LicensingConfig` (the ones the verifier reads), the product token from `IssuerConfig`. An unset account or
 *           token is a configuration bug, refused with a `RangeError` before any call. Sends through `createTransport()`
 *           (the global fetch, read on every send); never logs a body or the token. Any other failure is
 *           `LicenceIssuerUnavailableError` with the status only.
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decisions 1 to 3); ADR 0260 (calls go through the transport); ADR 0263; ADR 0173.
 */
import { Driver } from "@stackra/container";
import { createTransport } from "@stackra/transport";

import type { IssuerConfig } from "#config/issuer.config";
import type { LicensingConfig } from "#config/licensing.config";
import { LicenceIssuerUnavailableError } from "#core/errors/licence-issuer-unavailable.error";
import { isRecord } from "#core/functions/is-record.function";
import { LicenceIssuer } from "#core/ports/licence-issuer.port";
import type { LicenceDraft } from "#core/types/licence-draft.type";

/** Keygen speaks JSON:API. */
const JSON_API = "application/vnd.api+json";

/**
 * Issues Keygen licences.
 *
 * @example
 * const issuer = new KeygenLicenceIssuerDriver(buildConfig(LicensingConfig), buildConfig(IssuerConfig));
 * const id = await issuer.create({ policyId, name, expiry, metadata });
 */
export class KeygenLicenceIssuerDriver extends Driver(LicenceIssuer) {
  /** The Keygen origin and account. */
  private readonly licensing: LicensingConfig;

  /** The product token. */
  private readonly issuer: IssuerConfig;

  /** What the requests go through: the global fetch. */
  private readonly send = createTransport();

  /**
   * @param licensing - the Keygen origin and account.
   * @param issuer - the product token.
   */
  constructor(licensing: LicensingConfig, issuer: IssuerConfig) {
    super();
    this.licensing = licensing;
    this.issuer = issuer;
  }

  /** Creates the licence under `draft.policyId`; returns Keygen's id. */
  async create(draft: LicenceDraft): Promise<string> {
    const body = await this.call("POST", "/licenses", {
      data: {
        type: "licenses",
        attributes: {
          name: draft.name,
          expiry: draft.expiry.toISOString(),
          metadata: draft.metadata,
        },
        relationships: { policy: { data: { type: "policies", id: draft.policyId } } },
      },
    });
    const id = isRecord(body) && isRecord(body.data) ? body.data.id : undefined;
    if (typeof id !== "string") throw LicenceIssuerUnavailableError.create({ status: 201 });
    return id;
  }

  /** Patches the expiry and metadata. */
  async update(id: string, draft: Pick<LicenceDraft, "expiry" | "metadata">): Promise<void> {
    await this.call("PATCH", `/licenses/${encodeURIComponent(id)}`, {
      data: {
        type: "licenses",
        attributes: { expiry: draft.expiry.toISOString(), metadata: draft.metadata },
      },
    });
  }

  /** Checks out a signed, unencrypted file with the licence's entitlements. */
  async checkOut(id: string, ttlSeconds: number | undefined): Promise<string> {
    const query = new URLSearchParams({ include: "entitlements" });
    if (ttlSeconds !== undefined) query.set("ttl", String(ttlSeconds));
    const body = await this.call(
      "POST",
      `/licenses/${encodeURIComponent(id)}/actions/check-out?${query.toString()}`,
    );
    const attributes =
      isRecord(body) && isRecord(body.data) && isRecord(body.data.attributes)
        ? body.data.attributes
        : undefined;
    if (typeof attributes?.certificate !== "string")
      throw LicenceIssuerUnavailableError.create({ status: 200 });
    return attributes.certificate;
  }

  /** Suspends the licence. */
  async suspend(id: string): Promise<void> {
    await this.call("POST", `/licenses/${encodeURIComponent(id)}/actions/suspend`);
  }

  /**
   * One authenticated JSON:API call under the account.
   *
   * @throws RangeError when the account or the product token is not set.
   * @throws LicenceIssuerUnavailableError on a network failure or a non-2xx answer.
   */
  private async call(method: string, path: string, payload?: unknown): Promise<unknown> {
    const { apiUrl, account } = this.licensing;
    if (account === "") throw new RangeError("LicensingConfig.account is not set");
    if (this.issuer.productToken === "")
      throw new RangeError("IssuerConfig.productToken is not set");
    let response: Response;
    try {
      response = await this.send(
        new Request(`${apiUrl}/v1/accounts/${encodeURIComponent(account)}${path}`, {
          method,
          headers: {
            Authorization: `Bearer ${this.issuer.productToken}`,
            Accept: JSON_API,
            ...(payload === undefined ? {} : { "Content-Type": JSON_API }),
          },
          ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
        }),
      );
    } catch (error) {
      throw LicenceIssuerUnavailableError.create({ status: 0 }, { cause: error });
    }
    if (response.status < 200 || response.status > 299) {
      await response.body?.cancel();
      throw LicenceIssuerUnavailableError.create({ status: response.status });
    }
    if (response.status === 204) return {};
    return (await response.json().catch(() => ({}))) as unknown;
  }
}
