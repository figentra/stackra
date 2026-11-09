/**
 * Stackra file contract:
 * Purpose: `resourceActionsAt(options)`, the buttons a resource page draws at one place, in order: the derived links
 *          (a row's View, a record's Edit, the list's Create unless a placement draws it), the placed actions at that
 *          place, then a record's Delete.
 * Boundary: internal: pure; the web and native `useResourceActions` build each button (`link`, `placed`, `remove`)
 *           with their own runner and navigation. A placed action takes the record when its input names the record id.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 3 and 4).
 */
import type { AnyClass } from "@stackra/container";

import { ActionPlace } from "#core/enums/action-place.enum";
import { idOf } from "#core/functions/id-of.function";
import { placementsAt } from "#core/functions/placements-at.function";
import type { PageRef } from "#core/types/page-ref.type";
import type { PlacementNode } from "#core/types/placement-node.type";

/**
 * The buttons at `place`, for `record` when the place is a record's.
 *
 * @example
 * resourceActionsAt({ place: ActionPlace.Row, record, pages, placements, takesRecord, link, placed, remove });
 */
export function resourceActionsAt<T>({
  place,
  record,
  pages,
  placements,
  takesRecord,
  link,
  placed,
  remove,
}: {
  readonly place: ActionPlace;
  readonly record: object | undefined;
  readonly pages: { readonly view?: PageRef; readonly edit?: PageRef; readonly create?: PageRef };
  readonly placements: readonly PlacementNode[];
  readonly takesRecord: (action: AnyClass) => boolean;
  /** A derived link to `to`, for the record `recordId` when given. */
  readonly link: (id: "view" | "edit" | "create", to: PageRef, recordId?: string) => T;
  /** The buttons of one placement at its place in the list. */
  readonly placed: (node: PlacementNode, index: number, ids: readonly string[] | undefined) => T[];
  /** The Delete button over `ids`, when the resource deletes. */
  readonly remove: ((ids: readonly string[]) => T) | undefined;
}): T[] {
  const ids = record === undefined ? undefined : [idOf(record)];
  const out: T[] = [];
  const recordId = ids?.[0];
  const isRecordPlace = place === ActionPlace.Row || place === ActionPlace.View;
  if (place === ActionPlace.Row && recordId !== undefined && pages.view !== undefined)
    out.push(link("view", pages.view, recordId));
  if (isRecordPlace && recordId !== undefined && pages.edit !== undefined)
    out.push(link("edit", pages.edit, recordId));
  if (
    (place === ActionPlace.ListHeader || place === ActionPlace.Empty) &&
    pages.create !== undefined &&
    !placements.some((node) => node.kind === "create")
  )
    out.push(link("create", pages.create));
  placementsAt(placements, place, takesRecord).forEach((node, index) =>
    out.push(...placed(node, index, ids)),
  );
  if (remove !== undefined && ids !== undefined && isRecordPlace) out.push(remove(ids));
  return out;
}
