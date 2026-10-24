/**
 * Stackra file contract:
 * Purpose: `registerKind`, which records the kind of a bare-only kind base: a plain abstract class (`Service`,
 *          `Explorer`, and in other packages `Schema`, `Config`, `Model`) that needs no called form, so it needs no
 *          `createKind`.
 * Boundary: writes the kind registry; kind packages call it once per kind base at module load, authors never do.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 25); the STA-335 kind-base spike.
 */
import { KIND_RECORDS } from "#core/constants/kind-records.constant";

/**
 * Records `type` as a class of `kind`, with the options of a called form (`{}` for a bare one). The options are
 * copied and frozen.
 *
 * @example
 * export abstract class Schema {
 *   declare readonly "~kind": "schema";
 * }
 * registerKind(Schema, "schema");
 */
export function registerKind(
  type: object,
  kind: string,
  options: Readonly<Record<string, unknown>> = {},
): void {
  KIND_RECORDS.set(type, { kind, options: Object.freeze({ ...options }) });
}
