/**
 * Stackra file contract:
 * Purpose: `AutomationPrincipalInput`, what `AutomationPrincipals.mint` needs to give one automation its own principal:
 *          the automation's id, the tenant it runs in and the name an admin screen and the audit show.
 * Boundary: a type only. The grants are not here: they are chosen at publish time and bounded by the publisher's own
 *           (ADR 0153 decision 2, `@stackra/workflow`'s `PublisherAccess`), never by identity.
 * Runtime: isomorphic
 * Governing contract: ADR 0153 (decision 2); ADR 0013 (OS: identity holds every principal); STA-1264.
 */
import type { PublicId } from "@stackra/contracts";

/** One automation to mint a principal for. */
export interface AutomationPrincipalInput {
  /** The automation's id; one principal per automation and tenant. */
  readonly automationId: string;

  /** The tenant the automation runs in; absent for a platform automation. */
  readonly scopeId?: PublicId;

  /** The automation's name, shown where the principal is listed. */
  readonly name: string;
}
