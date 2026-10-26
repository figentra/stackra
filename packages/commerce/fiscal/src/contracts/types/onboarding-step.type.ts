/**
 * Stackra file contract:
 * Purpose: `OnboardingStep`, what a `FiscalOnboarding` step returns: the unit, the stage its credential reached and the
 *          authority's request id.
 * Boundary: a type only, the public facts of a `TillCredential`. The issued token, secret and attributes never leave
 *           the credential store.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 4).
 */
import type { TillCredential } from "#contracts/types/till-credential.type";

/** The public facts of the credential a step stored. */
export type OnboardingStep = Pick<TillCredential, "unitId" | "stage" | "requestId">;
