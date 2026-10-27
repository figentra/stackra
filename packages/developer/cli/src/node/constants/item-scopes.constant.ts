/**
 * Stackra file contract:
 * Purpose: `ITEM_SCOPES`, the scopes `stackra add` looks in, in order (`@stackra`, then `@stackra-pro`), and the only
 *          scopes `stackra publish` packs for.
 * Boundary: data only. A new scope needs an ADR (ADR 0453 decision 10), so this list moves with it.
 * Runtime: node
 * Governing contract: ADR 0453 (decisions 10 and 11); ADR 0077 (free and Pro scopes).
 */

/** The registry scopes, free first. */
export const ITEM_SCOPES = ["@stackra", "@stackra-pro"] as const;
