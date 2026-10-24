/**
 * Stackra file contract:
 * Purpose: `isRefusal`, the one test for "is this a refusal" (`isRefusal(error)`) and "is it this refusal"
 *          (`isRefusal(error, ProductNotFoundError)`), narrowing the value either way.
 * Boundary: recognises a refusal by the registry symbol on its prototype, never by `instanceof`, so a refusal built by
 *           another copy of this package (another bundle, a generated client, a worker) counts. A class matches by its
 *           code, so a subclass that overrides `code` (a remote refusal) is matched by the code it reports.
 * Runtime: isomorphic
 * Governing contract: ADR 0140, ADR 0232 (decision 2), ADR 0294 (decision 20).
 */
import type { Refusal } from "#core/bases/refusal.base";
import { REFUSAL_BRAND } from "#core/constants/refusal-brand.constant";

/**
 * Whether `value` is a refusal.
 *
 * @example
 * if (!kind && !isRefusal(error)) report(error);
 */
export function isRefusal(value: unknown): value is Refusal;

/**
 * Whether `value` is a refusal with the code of `type`.
 *
 * @example
 * if (isRefusal(error, ProductNotFoundError)) throw ctx.notFound({ code: error.code });
 */
export function isRefusal<T extends Refusal>(
  value: unknown,
  type: abstract new () => T,
): value is T;

/** Implementation of both forms: checks the brand, then the code of `type` when given. */
export function isRefusal(value: unknown, type?: abstract new () => Refusal): boolean {
  if (typeof value !== "object" || value === null) return false;
  if ((value as { readonly [REFUSAL_BRAND]?: unknown })[REFUSAL_BRAND] !== true) return false;
  return type === undefined || (value as Refusal).code === (type.prototype as Refusal).code;
}
