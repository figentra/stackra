/**
 * Stackra file contract:
 * Purpose: `AuthFlow`, how a target signs in: the BFF's HttpOnly cookie session or the authorization-code flow with
 *          PKCE in the system browser; the values of `IdentityConfig.flow`, keyed by target.
 * Boundary: an `Enum.of` value plus the type of the same name. Each code names the `SessionStore` driver gen's wiring
 *           picks for a target (`bff`, `pkce`), so a new flow is a new driver and a new case together.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8); ADR 0241 (decisions 2 and 4); ADR 0277; ADR 0294 (decision 16).
 */
import { Enum } from "@stackra/contracts";

/** The sign-in flows. */
export const AuthFlow = Enum.of({
  /** The web and the PWA: the BFF holds the tokens and the browser holds an HttpOnly cookie. */
  Bff: "bff",
  /** Desktop and mobile: the system browser, code and PKCE, the tokens in the `secrets` storage area. */
  Pkce: "pkce",
});

/** One of the codes above. */
export type AuthFlow = Enum.Value<typeof AuthFlow>;
