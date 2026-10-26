/**
 * Stackra file contract:
 * Purpose: `PackKeySchema`, one key a section schema declares: the full dotted key, the JSON Schema its value must
 *          pass, and whether every root pack must carry it.
 * Boundary: a type only; data the key's owner registers (OS for base sections, a product for its own). `required` is
 *           for a key with no package default: a root pack without it fails the check; an overlay never needs it. A
 *           `*` segment declares a family of keys whose last part is data (`notifications.channels.*`); it is never
 *           required.
 * Runtime: isomorphic
 * Governing contract: ADR 0417 (X2-19).
 */
import type { z } from "zod";

/** One declared key. */
export type PackKeySchema = {
  /** The full dotted key (`billing.price_currency`), or a family with `*` for one segment (`providers.*`). */
  readonly key: string;
  /** The JSON Schema (draft 2020-12) of the value. */
  readonly schema: Parameters<typeof z.fromJSONSchema>[0];
  /** True when every root pack must carry the key. */
  readonly required?: boolean;
};
