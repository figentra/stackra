/**
 * Stackra file contract:
 * Purpose: `recordIdKey(input, resourceKey)`, the input key an action takes the record id under: `id`, or `<noun>Id`
 *          where the noun is the model's name or its last word (`orderId`, `accountId` for `loyalty_account`).
 * Boundary: internal; reads the top-level keys of a zod object schema only. Decides an action's default places (ADR
 *           0307 rule 3) and what a row, the View page or the Edit page fills in.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 3: places follow the input).
 */
import type { ZodType } from "zod";

/** camelCase of a snake_case word. */
const camel = (word: string): string =>
  word.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/**
 * The record id key of `input`, or undefined when the action takes no record.
 *
 * @example
 * recordIdKey(FreezeAccountAction.input, "loyalty_kit.loyalty_account"); // "accountId"
 */
export function recordIdKey(input: ZodType | undefined, resourceKey: string): string | undefined {
  const shape = (input as { readonly shape?: Readonly<Record<string, unknown>> } | undefined)
    ?.shape;
  if (shape === undefined) return undefined;
  const model = resourceKey.slice(resourceKey.indexOf(".") + 1);
  const last = model.slice(model.lastIndexOf("_") + 1);
  return ["id", `${camel(model)}Id`, `${last}Id`].find((key) => key in shape);
}
