/**
 * Stackra file contract:
 * Purpose: `CapLiftFacts`, the facts a trust-cap rule set reads to lift a new tenant's anti-abuse caps (R1-OS-40: the
 *          paid-message cap until KYB): KYB passed, how long a paid plan has run, and whether a domain is verified.
 * Boundary: a type only, the shape of the rule-set input. Each fact has one producer: `kybPassed` the verification
 *           service, `paidPlanDays` this package (`paidPlanDays` over the scope's `PlanSnapshot`), `domainVerified`
 *           the tenancy service (`tenancy.domain.verified.v1`). The thresholds that lift a cap are rule-set data
 *           (`delivery.messaging_caps`), never code.
 * Runtime: isomorphic
 * Governing contract: ADR 0215; owner R1-OS-40 (cap lift); stackra-117 (STA-1247).
 */

/** The cap-lift facts of one tenant. */
export interface CapLiftFacts {
  /** Whether the tenant's KYB check passed. */
  readonly kybPassed: boolean;

  /** Whole days a paid plan has run without a break; 0 on a free plan or a trial. */
  readonly paidPlanDays: number;

  /** Whether the tenant holds at least one verified domain. */
  readonly domainVerified: boolean;
}
