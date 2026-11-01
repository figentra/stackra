/**
 * Stackra file contract:
 * Purpose: `TenantDraft`, what `TenantDirectory.create` needs to make a tenant: its name.
 * Boundary: a type only; the directory mints the id and the creation time.
 * Runtime: isomorphic
 * Governing contract: STA-1731 spec FR-001; ADR 0172.
 */

/** A tenant to create. */
export interface TenantDraft {
  /** Its display name. */
  readonly name: string;
}
