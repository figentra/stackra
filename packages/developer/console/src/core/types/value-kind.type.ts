/**
 * Stackra file contract:
 * Purpose: `ValueKind`, the kind of value one command field holds, read from its `@Str`, `@Int` or `@Num` decorator
 *          (or `boolean` for an undecorated option, `string` for an undecorated argument).
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-003.
 */

/** The value kinds a command field can hold; a `@List` field holds a list of them. */
export type ValueKind = "string" | "integer" | "number" | "boolean";
