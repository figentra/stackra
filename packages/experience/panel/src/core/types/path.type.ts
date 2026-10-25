/**
 * Stackra file contract:
 * Purpose: `Path<T>`, the dotted wire paths of a row type (`"totals.totalMinor"`): every data key, and the keys of its
 *          nested objects, four levels deep.
 * Boundary: a type only. A path stops at a scalar, a date, a list or a map; methods are not paths. Gen checks every key
 *           again against the recorded row (`column_key_unknown`).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 1: a table's keys are wire paths of the list row).
 */

/** Values a path stops at. */
type Leaf =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | null
  | undefined
  | Date
  | Iterable<unknown>
  | ((...args: never[]) => unknown);

/**
 * The dotted data paths of `T`.
 *
 * @example
 * type Keys = Path<{ id: string; totals: { totalMinor: number } }>; // "id" | "totals" | "totals.totalMinor"
 */
export type Path<T, Depth extends readonly unknown[] = []> = Depth["length"] extends 4
  ? never
  : {
      [K in keyof T & string]: T[K] extends (...args: never[]) => unknown
        ? never
        : NonNullable<T[K]> extends Leaf
          ? K
          : K | `${K}.${Path<NonNullable<T[K]>, [...Depth, unknown]>}`;
    }[keyof T & string];
