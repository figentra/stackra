/**
 * Stackra file contract:
 * Purpose: `TenantToken`, what a tenant token stands for: the tenant it resolves to and the purpose it was issued for.
 * Boundary: a type only. The token itself is never stored; `TenantTokens` keeps this record under the token's SHA-256.
 * Runtime: isomorphic
 * Governing contract: ADR 0239; ADR 0098 (the tenant never comes from input); OS scheduling-calendar SPEC gap 2.
 */
import type { PublicId } from "@stackra/contracts";

/** One issued tenant token. */
export interface TenantToken {
  /** The tenant the token resolves to. */
  readonly tenantId: PublicId<"scp">;

  /** What the token opens, a caller's code (`calendar.feed`); a token resolves for this purpose only. */
  readonly purpose: string;
}
