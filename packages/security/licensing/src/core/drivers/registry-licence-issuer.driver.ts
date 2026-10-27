/**
 * Stackra file contract:
 * Purpose: `RegistryLicenceIssuerDriver`, the default `LicenceIssuer`: the Stackra registry's own licence engine over
 *          its licence API (`/-/stackra/v1/licences`). `apply` sends any `RegistryLicenceCommand` (issue, renew, set
 *          grants, suspend, resume, revoke, add and revoke a token) with its Idempotency-Key and answers the
 *          `RegistryLicence`; the port's `create`, `update` and `suspend` map onto it.
 * Boundary: named `registry` by its file prefix; `IssuerConfig.driver` picks it. The origin and the issuer token are
 *           `IssuerConfig`'s; an unset token is a configuration bug, refused with a `RangeError` before any call. The
 *           port's draft carries the registry fields in its metadata (`holderRef`, `grants`, optional
 *           `idempotencyKey`); a draft without them is a `RangeError`. `checkOut` is refused: an offline licence file
 *           for on-prem comes from the `keygen` driver (ADR 0453 decision 15 keeps its own signing key, not built
 *           here). Never logs a body or a token; any failed call is `LicenceIssuerUnavailableError` with the status.
 * Runtime: isomorphic
 * Governing contract: ADR 0453 (decisions 13 to 15); ADR 0178; ADR 0260 (calls go through the transport); ADR 0263.
 */
import { Driver } from "@stackra/container";
import type { Json } from "@stackra/contracts";
import { createTransport, type Transport } from "@stackra/transport";

import type { IssuerConfig } from "#config/issuer.config";
import type { RegistryLicence } from "#contracts/types/registry-licence.type";
import type { RegistryLicenceCommand } from "#contracts/types/registry-licence-command.type";
import type { RegistryLicenceGrant } from "#contracts/types/registry-licence-grant.type";
import { LicenceIssuerUnavailableError } from "#core/errors/licence-issuer-unavailable.error";
import { isRecord } from "#core/functions/is-record.function";
import { LicenceIssuer } from "#core/ports/licence-issuer.port";
import type { LicenceDraft } from "#core/types/licence-draft.type";

/** The licence API under the registry origin. */
const LICENCES = "/-/stackra/v1/licences";

/** The grants a draft's metadata carries, or a `RangeError`. */
function grantsOf(metadata: Readonly<Record<string, Json>>): RegistryLicenceGrant[] {
  const grants = metadata.grants;
  if (
    !Array.isArray(grants) ||
    !grants.every(
      (grant) =>
        isRecord(grant) &&
        typeof grant.scope === "string" &&
        (grant.names === "*" ||
          (Array.isArray(grant.names) && grant.names.every((name) => typeof name === "string"))),
    )
  )
    throw new RangeError("the registry driver needs metadata.grants: { scope, names }[]");
  return grants as unknown as RegistryLicenceGrant[];
}

/** The draft's `idempotencyKey`, or a fresh one (a port call has no event id of its own). */
const keyOf = (metadata: Readonly<Record<string, Json>>, suffix: string): string =>
  typeof metadata.idempotencyKey === "string"
    ? `${metadata.idempotencyKey}:${suffix}`
    : crypto.randomUUID();

/**
 * Issues Stackra registry licences.
 *
 * @example
 * const issuer = new RegistryLicenceIssuerDriver(buildConfig(IssuerConfig));
 * const licence = await issuer.apply({
 *   action: "issue", idempotencyKey: event.id, holderRef: "acc_01H…",
 *   grants: [{ scope: "@stackra-pro", names: "*" }], notBefore: null, expiresAt: "2027-11-01T00:00:00.000Z",
 *   tokenLabel: "github-actions",
 * });
 * licence.issuedToken; // "stkl_…", shown once
 */
export class RegistryLicenceIssuerDriver extends Driver(LicenceIssuer) {
  /** The registry origin and the issuer token. */
  private readonly issuer: IssuerConfig;

  /** What the requests go through. */
  private readonly send: Transport;

  /**
   * @param issuer - the registry origin and the issuer token.
   * @param transport - what the requests go through; the global fetch when left out.
   */
  constructor(issuer: IssuerConfig, transport?: Transport) {
    super();
    this.issuer = issuer;
    this.send = transport ?? createTransport();
  }

  /**
   * Sends one licence API command.
   *
   * @throws RangeError when the issuer token is not set.
   * @throws LicenceIssuerUnavailableError on a network failure, a non-2xx answer or a body that is not a licence.
   */
  async apply(command: RegistryLicenceCommand): Promise<RegistryLicence> {
    const id = "licenceId" in command ? `/${encodeURIComponent(command.licenceId)}` : "";
    switch (command.action) {
      case "issue":
        return this.call("POST", LICENCES, command.idempotencyKey, {
          holderRef: command.holderRef,
          grants: command.grants,
          notBefore: command.notBefore,
          expiresAt: command.expiresAt,
          tokenLabel: command.tokenLabel,
        });
      case "renew":
        return this.call("PATCH", `${LICENCES}${id}`, command.idempotencyKey, {
          expiresAt: command.expiresAt,
        });
      case "setGrants":
        return this.call("PATCH", `${LICENCES}${id}`, command.idempotencyKey, {
          grants: command.grants,
        });
      case "suspend":
      case "resume":
      case "revoke":
        return this.call("POST", `${LICENCES}${id}/${command.action}`, command.idempotencyKey);
      case "addToken":
        return this.call("POST", `${LICENCES}${id}/tokens`, command.idempotencyKey, {
          label: command.tokenLabel,
        });
      case "revokeToken":
        return this.call(
          "DELETE",
          `${LICENCES}${id}/tokens/${encodeURIComponent(command.tokenId)}`,
          command.idempotencyKey,
        );
    }
  }

  /**
   * Issues a licence without a token (add one with `apply({ action: "addToken" })`, which answers it once); returns
   * its id. `draft.metadata` carries `holderRef` and `grants`; `policyId` and `name` are not used.
   */
  async create(draft: LicenceDraft): Promise<string> {
    const holderRef = draft.metadata.holderRef;
    if (typeof holderRef !== "string" || holderRef === "")
      throw new RangeError("the registry driver needs metadata.holderRef");
    const licence = await this.apply({
      action: "issue",
      idempotencyKey: keyOf(draft.metadata, "issue"),
      holderRef,
      grants: grantsOf(draft.metadata),
      notBefore: null,
      expiresAt: draft.expiry.toISOString(),
      tokenLabel: null,
    });
    return licence.id;
  }

  /** Renews to `draft.expiry`, and sets the grants when the metadata carries them. */
  async update(id: string, draft: Pick<LicenceDraft, "expiry" | "metadata">): Promise<void> {
    await this.apply({
      action: "renew",
      idempotencyKey: keyOf(draft.metadata, "renew"),
      licenceId: id,
      expiresAt: draft.expiry.toISOString(),
    });
    if (draft.metadata.grants !== undefined)
      await this.apply({
        action: "setGrants",
        idempotencyKey: keyOf(draft.metadata, "grants"),
        licenceId: id,
        grants: grantsOf(draft.metadata),
      });
  }

  /**
   * Refused: the registry issues tokens, not offline files.
   *
   * @throws RangeError always; an on-prem file comes from the `keygen` driver.
   */
  async checkOut(_id: string, _ttlSeconds: number | undefined): Promise<string> {
    throw new RangeError(
      "the registry driver has no offline licence file; use the keygen driver for on-prem",
    );
  }

  /** Suspends the licence; reads of licensed scopes stop within `registry.tokenCacheSeconds`. */
  async suspend(id: string): Promise<void> {
    await this.apply({ action: "suspend", idempotencyKey: crypto.randomUUID(), licenceId: id });
  }

  /**
   * One authenticated call; answers the licence in the body.
   *
   * @throws RangeError when the issuer token is not set.
   * @throws LicenceIssuerUnavailableError on a network failure, a non-2xx answer or a body without a licence id.
   */
  private async call(
    method: string,
    path: string,
    idempotencyKey: string,
    payload?: unknown,
  ): Promise<RegistryLicence> {
    if (this.issuer.issuerToken === "") throw new RangeError("IssuerConfig.issuerToken is not set");
    let response: Response;
    try {
      response = await this.send(
        new Request(`${this.issuer.registryUrl}${path}`, {
          method,
          headers: {
            Authorization: `Bearer ${this.issuer.issuerToken}`,
            Accept: "application/json",
            "Idempotency-Key": idempotencyKey,
            ...(payload === undefined ? {} : { "Content-Type": "application/json" }),
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
    const body = (await response.json().catch(() => null)) as unknown;
    if (!isRecord(body) || typeof body.id !== "string")
      throw LicenceIssuerUnavailableError.create({ status: response.status });
    return body as unknown as RegistryLicence;
  }
}
