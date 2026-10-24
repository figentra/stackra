/**
 * Stackra file contract:
 * Purpose: `PUBLIC_ENV_PREFIXES`, the variable prefixes whose values may reach a client bundle or binary: `VITE_`,
 *          `EXPO_PUBLIC_` and `RENDERER_VITE_`. `hydrateEnv(..., { only: "public" })` reads these names only, and
 *          `PublicPart<C>` keeps the fields mapped to them.
 * Boundary: a frozen tuple; the one list of public prefixes (ADR 0231 decision 4). Internal: not exported from the
 *           entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (decision 4: public values never hold a secret); ADR 0173.
 */

/** The public variable prefixes. */
export const PUBLIC_ENV_PREFIXES = Object.freeze([
  "VITE_",
  "EXPO_PUBLIC_",
  "RENDERER_VITE_",
] as const);
