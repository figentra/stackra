/**
 * Stackra file contract:
 * Purpose: `otlpValue(value)`, a redacted field value as an OTLP/JSON `AnyValue`: strings, booleans, integers, doubles,
 *          arrays, plain objects (as key-value lists) and dates; anything else as its text, `null` and `undefined` as
 *          the empty value.
 * Boundary: pure. It reads values that already passed `redact`; it never reads a getter's side effect beyond the own
 *           enumerable keys. Nesting deeper than eight levels is cut to the text `[depth]`, so a cycle cannot loop.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 1); the OTLP/JSON encoding.
 */
import type { OtlpAnyValue } from "#core/types/otlp-any-value.type";

/** The deepest nesting written. */
const MAX_DEPTH = 8;

/**
 * Encodes one value.
 *
 * @example
 * otlpValue({ lines: 3 }); // { kvlistValue: { values: [{ key: "lines", value: { intValue: "3" } }] } }
 */
export function otlpValue(value: unknown, depth = 0): OtlpAnyValue {
  if (value === null || value === undefined) return {};
  if (depth >= MAX_DEPTH) return { stringValue: "[depth]" };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { boolValue: value };
  if (typeof value === "number")
    return Number.isSafeInteger(value) ? { intValue: String(value) } : { doubleValue: value };
  if (typeof value === "bigint") return { intValue: value.toString() };
  if (value instanceof Date) return { stringValue: value.toISOString() };
  if (Array.isArray(value))
    return { arrayValue: { values: value.map((item) => otlpValue(item, depth + 1)) } };
  if (typeof value === "object")
    return {
      kvlistValue: {
        values: Object.entries(value).map(([key, item]) => ({
          key,
          value: otlpValue(item, depth + 1),
        })),
      },
    };
  return { stringValue: String(value) };
}
