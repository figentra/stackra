/**
 * Stackra file contract:
 * Purpose: `RefSchema`, what a generated ref takes as its input or output: a zod schema, or a remote shape class
 *          (`OrderView`) that carries one in its static `schema`.
 * Boundary: a type only; `SchemaOf` reads the zod schema out of either form.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 3); ADR 0261 (generated `#stackra/clients`).
 */
import type { ZodType } from "zod";

/** A zod schema, or a class whose static `schema` is one. */
export type RefSchema = ZodType | { readonly schema: ZodType };
