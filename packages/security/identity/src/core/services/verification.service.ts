/**
 * Stackra file contract:
 * Purpose: `VerificationService`, the home of KYC and KYB: it runs a check through the providers the market pack lists
 *          for its kind, in the pack's order, skipping a provider that is not wired here or does not support the kind,
 *          and moving on when one is unavailable. `verifyThrough` runs it through the Connections `ProviderResolver`
 *          answered for the `verification` capability instead: a platform check (use A) only through managed ones, a
 *          tenant check (use B) through the tenant's own first.
 * Boundary: the providers per market and kind are pack data under `IdentityConfig.verificationPackKey`
 *           (`{ "company": ["wathq"], "identity": ["nafath", "uqudo"] }`); the drivers are registered by key at boot
 *           from the deployment's wiring. No country or provider is named in code. What a result allows is a rule set.
 *           The caller pins a platform check with `{ pin: "managed" }` on `ProviderResolver#candidates("verification",
 *           …)`; this service drops an own candidate of a platform check again, so a mis-pinned call still never
 *           reaches a tenant's account.
 * Runtime: isomorphic
 * Governing contract: Stackra 0357 (decision 7); OS-54 (own verification service, drivers per market); ADR 0370; ADR
 *                     0363; ADR 0376 (decision 1, verification Note); owner decision R3-1; capability map M2.
 */
import { Service } from "@stackra/container";
import { isRefusal } from "@stackra/errors";
import { type ResolvedPack, valueOf } from "@stackra/market-packs";

import type { IdentityConfig } from "#config/identity.config";
import { VerificationUse } from "#contracts/enums/verification-use.enum";
import type {
  Verification,
  VerificationCandidate,
  VerificationRequest,
  VerificationResult,
} from "#contracts/index";
import { VerificationUnavailableError } from "#core/errors/verification-unavailable.error";

/**
 * Runs KYC and KYB checks through the market's providers.
 *
 * @example
 * verifications.register("registry", registryDriver);
 * const result = await verifications.verify(request, await packs.resolve(request.market), today);
 */
export class VerificationService extends Service {
  /** The pack key. */
  private readonly config: IdentityConfig;

  /** Driver key to driver. */
  private readonly drivers = new Map<string, Verification>();

  /**
   * @param config - the pack key of the provider lists.
   */
  constructor(config: IdentityConfig) {
    super();
    this.config = config;
  }

  /** Wires `driver` under `key`, the name market packs list it by; a later driver replaces it. */
  register(key: string, driver: Verification): void {
    this.drivers.set(key, driver);
  }

  /** The provider keys `resolved` lists for `request.kind` on `on` that are wired here. */
  providersFor(
    request: Pick<VerificationRequest, "kind">,
    resolved: ResolvedPack,
    on: string,
  ): readonly string[] {
    const lists = valueOf(resolved, this.config.verificationPackKey, on)?.value;
    if (typeof lists !== "object" || lists === null || Array.isArray(lists)) return [];
    const listed = (lists as Readonly<Record<string, unknown>>)[request.kind];
    if (!Array.isArray(listed)) return [];
    return listed.filter(
      (key): key is string =>
        typeof key === "string" && this.drivers.get(key)?.supports(request.kind) === true,
    );
  }

  /**
   * Runs `request` at the first listed provider that answers.
   *
   * @throws VerificationUnavailableError when no listed provider is wired or every one is unavailable.
   * @throws RangeError when the request's market is not the resolved pack's.
   */
  async verify(
    request: VerificationRequest,
    resolved: ResolvedPack,
    on: string,
  ): Promise<VerificationResult> {
    if (request.market !== resolved.market)
      throw new RangeError(`the check is for ${request.market}, the pack for ${resolved.market}`);
    for (const key of this.providersFor(request, resolved, on)) {
      try {
        // oxlint-disable-next-line no-await-in-loop -- reason: a provider is tried only when the one before failed
        const answer = await (this.drivers.get(key) as Verification).verify(request);
        return { ...answer, provider: key };
      } catch (error) {
        if (!(isRefusal(error) && error.code === "verification_unavailable")) throw error;
      }
    }
    throw VerificationUnavailableError.create();
  }

  /**
   * Runs `request` at the first candidate that supports its kind and answers, in the order given (the resolver's:
   * own first, then managed). A platform check skips own candidates.
   *
   * @param candidates - `ProviderResolver#candidates("verification", …)`, pinned to `managed` for a platform check.
   * @throws VerificationUnavailableError when no candidate is left or every one is unavailable.
   */
  async verifyThrough(
    request: VerificationRequest,
    candidates: readonly VerificationCandidate[],
  ): Promise<VerificationResult> {
    const platform = (request.use ?? VerificationUse.Platform) === VerificationUse.Platform;
    for (const { provider, connection, mode } of candidates) {
      if ((platform && mode === "own") || !connection.supports(request.kind)) continue;
      try {
        // oxlint-disable-next-line no-await-in-loop -- reason: a provider is tried only when the one before failed
        const answer = await connection.verify(request);
        return { ...answer, provider, mode };
      } catch (error) {
        if (!(isRefusal(error) && error.code === "verification_unavailable")) throw error;
      }
    }
    throw VerificationUnavailableError.create();
  }
}
