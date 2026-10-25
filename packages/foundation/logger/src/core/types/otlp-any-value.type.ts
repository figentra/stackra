/**
 * Stackra file contract:
 * Purpose: `OtlpAnyValue`, the OTLP/JSON `AnyValue` a log record's body and attributes are written as.
 * Boundary: a type only, the subset of the OpenTelemetry protocol this package writes (64-bit integers are strings, as
 *           OTLP/JSON requires).
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 1: OpenTelemetry); the OTLP/JSON encoding.
 */

/** One OTLP value. */
export type OtlpAnyValue =
  | { readonly stringValue: string }
  | { readonly boolValue: boolean }
  | { readonly intValue: string }
  | { readonly doubleValue: number }
  | { readonly arrayValue: { readonly values: readonly OtlpAnyValue[] } }
  | {
      readonly kvlistValue: {
        readonly values: readonly { readonly key: string; readonly value: OtlpAnyValue }[];
      };
    }
  | Readonly<Record<string, never>>;
