/**
 * Stackra file contract:
 * Purpose: `toRefuseWith`, the matcher that checks a call was refused with a given refusal:
 *          `await expect(promise).rejects.toRefuseWith(refusal(X, details?))` for a thrown refusal, and
 *          `expect(result).toRefuseWith(refusal(X))` for a result `{ ok: false, error }` or an envelope.
 * Boundary: compares the contract, never message text (ADR 0232 decision 7): the code must be equal, every detail the
 *           expected refusal sets must equal the received one, and its field errors, when it has any, must be equal.
 *           Details the expected refusal leaves out are not checked. Registered with `expect` when this entry is
 *           imported.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3), ADR 0232 (decision 7), ADR 0140.
 */
import { createMatcher } from "@stackra/testing";

import { isRefusal, type ErrorEnvelope, type Refusal } from "#core/index";

/** Structural equality for details: primitives, dates, arrays and plain objects. */
function same(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (left instanceof Date && right instanceof Date) return left.getTime() === right.getTime();
  if (typeof left !== "object" || typeof right !== "object" || left === null || right === null)
    return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key) =>
      same((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key]),
    )
  );
}

/** The envelope of a refusal, of the `error` of a failed result, or an envelope as it is; else undefined. */
function envelopeOf(received: unknown): ErrorEnvelope | undefined {
  if (isRefusal(received)) return received.toEnvelope();
  if (typeof received !== "object" || received === null) return undefined;
  const value = received as Record<string, unknown>;
  if (value["ok"] === false && "error" in value) return envelopeOf(value["error"]);
  return typeof value["code"] === "string" && typeof value["category"] === "string"
    ? (value as unknown as ErrorEnvelope)
    : undefined;
}

/** A short description of what was received, for the failure message. */
function summary(envelope: ErrorEnvelope | undefined, received: unknown): string {
  if (envelope === undefined) return `no refusal (${String(received)})`;
  return JSON.stringify({
    code: envelope.code,
    details: envelope.details ?? {},
    ...(envelope.fieldErrors === undefined ? {} : { fieldErrors: envelope.fieldErrors }),
  });
}

/**
 * Passes when `received` carries a refusal with `expected`'s code, the details `expected` sets and, if `expected` has
 * field errors, the same field errors.
 *
 * @throws TypeError when `expected` is not a refusal (build it with `refusal(X)`).
 */
export const toRefuseWith = createMatcher(
  "toRefuseWith",
  (received: unknown, expected: Refusal) => {
    if (!isRefusal(expected))
      throw new TypeError(
        "toRefuseWith(expected): build the expected value with refusal(X, details?)",
      );
    const actual = envelopeOf(received);
    const details = actual?.details ?? {};
    const pass =
      actual !== undefined &&
      actual.code === expected.code &&
      Object.entries(expected.details).every(([key, value]) => same(details[key], value)) &&
      (expected.fieldErrors === undefined || same(actual.fieldErrors, expected.fieldErrors));
    return {
      pass,
      message: () =>
        `expected ${pass ? "not " : ""}to be refused with ${summary(expected.toEnvelope(), expected)}, ` +
        `received ${summary(actual, received)}`,
    };
  },
);

declare module "@stackra/testing" {
  interface Matchers<R> {
    /** Asserts a refusal by code, the details the expected refusal sets and its field errors. */
    toRefuseWith(expected: Refusal): R;
  }
}
