/**
 * Stackra file contract:
 * Purpose: `filterColumnKind(filter, choices, t)`, the collection column type a table filter draws as when no control
 *          is recorded: the trashed filter as with or only, a range as a number, a date range as days, is-null as yes
 *          or no, a filter with choices as a choice, the rest as text.
 * Boundary: internal: pure; the web and native resource tables merge it into the filter's column.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 9 and 11); ADR 0505.
 */
import type { I18nKey } from "@stackra/i18n";
import type { CollectionColumn } from "@stackra/ui/contracts";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import type { FilterNode } from "#core/types/filter-node.type";

/**
 * The column type of `filter`.
 *
 * @example
 * filterColumnKind({ kind: "range", key: "total" }, undefined, t); // { type: "number" }
 */
export function filterColumnKind(
  filter: FilterNode,
  choices: CollectionColumn["options"] | undefined,
  t: (key: I18nKey) => string,
): Partial<CollectionColumn> {
  if (filter.kind === "trashed")
    return {
      type: "choice",
      options: [
        { id: "with", label: t(PANEL_KEYS.panel.resources.trashed_with) },
        { id: "only", label: t(PANEL_KEYS.panel.resources.trashed_only) },
      ],
    };
  if (filter.kind === "range") return { type: "number" };
  if (filter.kind === "dateRange") return { type: "date" };
  if (filter.kind === "isNull") return { type: "boolean" };
  return choices === undefined ? { type: "text" } : { type: "choice", options: choices };
}
