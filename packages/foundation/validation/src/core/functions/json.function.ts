/**
 * Stackra file contract:
 * Purpose: `json()`, the schema generated code writes for a field typed `Json` (a rich-text body, an extension's
 *          payload, an actor chain): any JSON value, with the output typed `Json` so `X$Check` holds.
 * Boundary: zod's JSON schema re-typed to the contracts `Json`; `undefined`, functions, `Date` and class instances are
 *           refused. Authored code never calls it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: the shape compiler maps platform types); ADR 0154 (tenant data carries no
 *                     code).
 */
import type { Json } from "@stackra/contracts";
import { z } from "zod";
import type { ZodType } from "zod";

/**
 * A new schema of JSON values.
 *
 * @example
 * export const CreateOrderInput$ = z.object({ extensions: z.record(z.string(), json()).default(() => ({})) });
 */
export function json(): ZodType<Json, Json> {
  return z.json() as unknown as ZodType<Json, Json>;
}
