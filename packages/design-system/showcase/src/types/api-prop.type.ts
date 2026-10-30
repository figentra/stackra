/**
 * Stackra file contract:
 * Purpose: `ApiProp`, one row of a generated API table.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 7.1; ADR 0305 (one declaration per file).
 */

/** One prop, render prop, event or animation option of a part. */
export interface ApiProp {
  readonly name: string;
  readonly type: string;
  readonly default?: string;
  readonly required: boolean;
  /** English; Arabic comes from `api::<key>.<Part>.<prop>`. */
  readonly description: string;
  /** Where the member is declared. */
  readonly source: "stackra" | "heroui" | "react-aria";
  /** The HeroUI prop this one replaces ("isPending" on our "isLoading"). */
  readonly replaces?: string;
  readonly deprecated?: string;
}
