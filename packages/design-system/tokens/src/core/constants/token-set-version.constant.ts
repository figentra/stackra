/**
 * Stackra file contract:
 * Purpose: the version of the token set, the theme paths a stored layer may name (ADR 0340 decision 6). A changes-only
 *          export (`stackra.theme-diff/2`) carries it, so a diff stored by a tenant or a product says which paths it
 *          was written against. It moves when a path is renamed (with its alias in `TOKEN_PATH_ALIASES`) or removed.
 * Boundary: data only.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decision 6).
 */

/** The current token-set version. 1 is the first versioned set; `stackra.theme-diff/1` files carry none. */
export const TOKEN_SET_VERSION = 1;
