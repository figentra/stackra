/**
 * Stackra file contract:
 * Purpose: `KindRecord`, what the kind registry holds for a class: its kind and the options its nearest called base
 *          was given. The container, `createDecorator` and the testing module read it instead of reflect-metadata.
 * Boundary: a type only; the registry lives in `kind-records.constant.ts` and is read through `kindOf`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 25); ADR 0227 2026-10-24 note (no runtime reflection).
 */

/** The kind of a class and the options of its nearest called base (`{}` for a bare form). */
export interface KindRecord {
  /** The kind code, such as `"module"`, `"service"` or `"action"`. */
  readonly kind: string;

  /** The options the called form was given, frozen; `{}` for a bare form. */
  readonly options: Readonly<Record<string, unknown>>;
}
