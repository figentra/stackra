/**
 * Stackra file contract:
 * Purpose: `ApiKeyKind`, the two kinds of API key: a secret key a server keeps, and a publishable key a browser may
 *          hold, which works only from the origins listed on it (the Storefront API).
 * Boundary: an `Enum.of` value plus the type of the same name. Each kind has its own prefix in `IdentityConfig`, so a
 *           scanner and the gateway tell them apart without a lookup.
 * Runtime: isomorphic
 * Governing contract: ADR 0278 (decisions 4, 5 and 7); COM-56 (Storefront API key); ADR 0294 (decision 16).
 */
import { Enum } from "@stackra/contracts";

/** The kinds of API key. */
export const ApiKeyKind = Enum.of({
  /** Shown once, kept by a server, never in a browser. */
  Secret: "secret",
  /** Safe in a browser: bound to its origins and to read-mostly scopes. */
  Publishable: "publishable",
});

/** One of the codes above. */
export type ApiKeyKind = Enum.Value<typeof ApiKeyKind>;
