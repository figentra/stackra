/**
 * Stackra file contract:
 * Purpose: `VerifiedToken`, the claims of the request's verified bearer token, held for the checks and code that run
 *          after `BearerTokenGuard` in the same request (the scope claim step, assurance, the actor).
 * Boundary: `Lifetime.Request`, so each `container.forRequest()` has its own and no claim crosses requests. Only the
 *           guard writes it; `claims` is undefined until it has verified a token (a public path, or no guard bound).
 * Runtime: node
 * Governing contract: ADR 0206 (decision 8); ADR 0294 (decision 17: lifetimes); ADR 0437 (decision 8: authentication).
 */
import { Lifetime, Service } from "@stackra/container";

/**
 * The verified token of the running request.
 *
 * @example
 * const scopePath = verified.claims?.[IDENTITY_CLAIMS.scopePath];
 */
@Lifetime(Lifetime.Request)
export class VerifiedToken extends Service {
  /** The verified claims, or undefined when no token was verified on this request. */
  claims: Readonly<Record<string, unknown>> | undefined = undefined;
}
