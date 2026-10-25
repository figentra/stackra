/**
 * Stackra file contract:
 * Purpose: `stepUpSignIn`, the sign-in options a client passes after `step_up_required`: re-authenticate now
 *          (`prompt=login`, `max_age=0`), asking for the given authentication contexts when the provider uses them.
 * Boundary: pure; the second factor itself is the provider's MFA policy (ADR 0207 decision 1 cascades it down the
 *           tenant tree), so this asks for a fresh authentication and never names a method.
 * Runtime: isomorphic
 * Governing contract: ADR 0207 (decision 1); OpenID Connect Core (`prompt`, `max_age`, `acr_values`).
 */
import type { SignInOptions } from "#contracts/index";

/**
 * The options of a step-up sign-in.
 *
 * @example
 * catch (error) { if (error.code === "step_up_required") await session.signIn(stepUpSignIn()); }
 */
export function stepUpSignIn(acrValues: readonly string[] = []): SignInOptions {
  return {
    forceLogin: true,
    maxAge: 0,
    ...(acrValues.length === 0 ? {} : { acrValues }),
  };
}
