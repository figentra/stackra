/**
 * Stackra file contract:
 * Purpose: `SECRET_REFERENCE`, the `$NAME` form a `.mcp.yaml` argument uses to name a secret (SCREAMING_SNAKE after
 *          a bare `$`, as in `x-heroui-personal-token:$HEROUI_PERSONAL_TOKEN`). The name is the first capture group.
 * Boundary: a pattern only. It is global, so read it with `matchAll` or `split`, never with `test` or `exec`.
 * Runtime: isomorphic
 * Governing contract: ADR 0173 (secret names in git, values never); ADR 0231 (SCREAMING_SNAKE secret names).
 */

/** One `$NAME` secret reference; group 1 is the name. */
export const SECRET_REFERENCE = /\$([A-Z][A-Z0-9_]*)/g;
