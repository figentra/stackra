/**
 * Stackra file contract:
 * Purpose: `PUBLIC_VAR_PREFIXES`, the prefixes of the public variables `definesFor` inlines into a bundle: `VITE_`,
 *          `EXPO_PUBLIC_` and `RENDERER_VITE_`. Every other var (`STACKRA_*`, a server value) stays out of the bundle.
 * Boundary: internal; a name with one of these prefixes never holds a secret (ADR 0231 decision 4).
 * Runtime: node
 * Governing contract: ADR 0231 (decision 4: public prefixes), ADR 0173.
 */

/** The public variable prefixes, in no particular order. */
export const PUBLIC_VAR_PREFIXES = ["VITE_", "EXPO_PUBLIC_", "RENDERER_VITE_"] as const;
