/**
 * Stackra file contract:
 * Purpose: `ApiMember`, one documented member of an exported class, interface, object type or enum: its name, kind,
 *          one-line signature and TSDoc.
 * Boundary: data only; `ApiReader` fills it and the page renderer reads it.
 * Runtime: node
 * Governing contract: ADR 0007 (docblock standard); STA-2857.
 */
import type { ApiDoc } from "#scripts/api-reference/api-doc.type";

/** One member row of a class, interface, object type or enum in the API reference. */
export interface ApiMember {
  /** The member name as written (`constructor` for a class constructor, `[key]` for an index signature). */
  readonly name: string;
  /** What the member is. */
  readonly kind:
    | "constructor"
    | "property"
    | "method"
    | "accessor"
    | "call"
    | "index"
    | "enum-member";
  /** The member's declaration on one line, without its comment or body. */
  readonly signature: string;
  /** True for a `static` class member. */
  readonly isStatic: boolean;
  /** The member's TSDoc. */
  readonly doc: ApiDoc;
}
