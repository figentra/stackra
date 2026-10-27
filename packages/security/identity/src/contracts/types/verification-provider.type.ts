/**
 * Stackra file contract:
 * Purpose: `VerificationProvider`, what a verifying Connection does: the two calls of the `Verification` port, the
 *          connection a `VerificationCandidate` carries.
 * Boundary: a type only, structurally the same as integrations' provider shape for verification, so this package needs
 *           no dependency on `@stackra/integrations`.
 * Runtime: isomorphic
 * Governing contract: ADR 0376 (decision 1, verification Note); ADR 0356 (decision 7); capability map M2.
 */
import type { Verification } from "#contracts/ports/verification.port";

/** What a verifying Connection does: the two calls of the `Verification` port. */
export type VerificationProvider = Pick<Verification, "supports" | "verify">;
