/**
 * Stackra file contract:
 * Purpose: `refusal(X, details?)`, a refusal built for a test: the expected value of `toRefuseWith`, or what a fake
 *          throws (`fake.on(Action).throws(refusal(RateLimitedError))`).
 * Boundary: test-only. The details are partial, because a test states only what it checks, and `fields` gives the
 *           field errors (`refusal(InsufficientStockError, { fields: { "lines.0.variantId": "insufficient_stock" } })`).
 *           It builds through `X.create`, so the result is a real refusal: thrown, matched and enveloped like one.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3: domain helpers in the owning package's ./testing), ADR 0140.
 */
import type { FieldErrors, Refusal, RefusalDetails } from "#core/index";

/**
 * A refusal of `type` with some of its details and, optionally, field errors.
 *
 * @param type - the refusal class.
 * @param details - the details the test cares about, plus `fields` for the field errors.
 * @returns a refusal of `type`.
 * @example
 * await expect(loyalty.assertCanRedeem(member, 101)).rejects.toRefuseWith(refusal(InsufficientPointsError));
 * const locked = refusal(SettingsLockedError, { fields: { [KEY]: "settings_locked" } });
 */
export function refusal<T extends Refusal>(
  type: new () => T,
  details: Partial<RefusalDetails<T>> & { readonly fields?: FieldErrors } = {},
): T {
  const { fields, ...rest } = details;
  // The class's `create` types its required details; a test passes only some of them, on purpose.
  const create = (type as unknown as { create(this: unknown, details: object, extras: object): T })
    .create;
  return create.call(type, rest, fields === undefined ? {} : { fieldErrors: fields });
}
