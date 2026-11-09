/**
 * Stackra file contract:
 * Purpose: `FIRST_FACTOR_ENROLMENT_ACTIONS`, the actions allowed to declare `stepUp: { exempt:
 *          "first-factor-enrolment" }`: the one call that enrols a user's first strong factor, who has nothing to step
 *          up with yet (STA-340).
 * Boundary: data only, by action identity without the version (`<module>.<key>`). Adding an entry is a reviewed
 *           change to gen, never a member's choice: the exemption must stay this narrow (ADR 0406, amendment of
 *           2026-11-07). Each listed action enforces its own rule (a fresh session for the first factor, AAL2 after).
 * Runtime: isomorphic
 * Governing contract: ADR 0406 (amendment of 2026-11-07); STA-340.
 */

/** The action identities that may take the first-factor enrolment exemption. */
export const FIRST_FACTOR_ENROLMENT_ACTIONS: ReadonlySet<string> = new Set([
  "identity.passkey.confirm",
]);
