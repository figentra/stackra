/**
 * Stackra file contract:
 * Purpose: `MemoryIdentityResolverDriver`, the contracts' `IdentityResolver` over a fixed set of principals in memory:
 *          the address and language of each `usr_` id, for tests, previews and `stackra dev`.
 * Boundary: every address it holds counts as verified. A lookup by address compares case-insensitively, as the port
 *           requires; an unknown principal refuses `not_found`. It never reaches the identity provider.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0206 (decision 2); ADR 0134 (personal data is resolved).
 */
import { Driver } from "@stackra/container";
import { IdentityResolver } from "@stackra/contracts";
import type { Email, PublicId, VerifiedPrincipal } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";

/**
 * Principals in memory.
 *
 * @example
 * const identity = new MemoryIdentityResolverDriver({
 *   usr_01j9z3k4m5n6p7q8r9s0t1v2w3: { email: "a@acme.example", locale: "ar" },
 * });
 * await identity.emailOf("usr_01j9z3k4m5n6p7q8r9s0t1v2w3"); // "a@acme.example"
 */
export class MemoryIdentityResolverDriver extends Driver(IdentityResolver) {
  /** The address and language per principal. */
  private readonly principals: ReadonlyMap<PublicId<"usr">, Omit<VerifiedPrincipal, "id">>;

  /**
   * @param principals - the address and language of each principal.
   */
  constructor(principals: Readonly<Record<PublicId<"usr">, Omit<VerifiedPrincipal, "id">>> = {}) {
    super();
    // The keys are the record's own `usr_` keys, so the entries keep that type.
    this.principals = new Map(
      Object.entries(principals) as [PublicId<"usr">, Omit<VerifiedPrincipal, "id">][],
    );
  }

  /**
   * The principal's address.
   *
   * @throws NotFoundError when the principal is unknown.
   */
  async emailOf(principalId: PublicId<"usr">): Promise<Email> {
    return (await this.principalOf(principalId)).email;
  }

  /**
   * The principal with its address, language and, when held, phone and time zone.
   *
   * @throws NotFoundError when the principal is unknown.
   */
  async principalOf(principalId: PublicId<"usr">): Promise<VerifiedPrincipal> {
    const principal = this.principals.get(principalId);
    if (principal === undefined) throw NotFoundError.create();
    return { id: principalId, ...principal };
  }

  /** The principal whose address is `email`, compared case-insensitively, or `null`. */
  async principalByVerifiedEmail(email: Email): Promise<VerifiedPrincipal | null> {
    const wanted = email.toLowerCase();
    for (const [id, principal] of this.principals)
      if (principal.email.toLowerCase() === wanted) return { id, ...principal };
    return null;
  }
}
