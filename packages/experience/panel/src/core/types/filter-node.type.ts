/**
 * Stackra file contract:
 * Purpose: `FilterNode`, one recorded table filter: a row path with its default and whether it is pinned beside search, or
 *          the trashed filter of a soft-deleting model.
 * Boundary: a type only; built by `Filter.*` and by the table builder.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 2: filter is a typed object of the declared filters).
 */
import type { Enum } from "@stackra/contracts";

/** One table filter. */
export type FilterNode =
  | {
      /** As typed, or a principal picker. */
      readonly kind: "value" | "principal";
      /** The row path; it needs an index (`filter_not_indexed`). */
      readonly key: string;
      /** The value the filter starts with. */
      readonly default?: unknown;
      /** Whether it sits beside the search box. */
      readonly pinned?: boolean;
      /** The enum whose codes the filter offers; gen fills it from the row type. */
      readonly enum?: Enum.Any;
    }
  | {
      /** With, without or only soft-deleted records. */
      readonly kind: "trashed";
    };
