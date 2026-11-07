/**
 * Stackra file contract:
 * Purpose: unit tests of `resourceActionsAt`: a row's View and Edit links, its placed actions and its Delete in that
 *          order; the list header's Create link unless a placement draws it; no Delete off a record place.
 * Boundary: test only; the buttons are their ids.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 3 and 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { ActionPlace } from "#core/enums/action-place.enum";
import { resourceActionsAt } from "#core/functions/resource-actions-at.function";
import type { PlacementNode } from "#core/types/placement-node.type";

class FreezeAction {}

const page = (name: string) => ({ name, path: `/${name}` });
const pages = { view: page("view"), edit: page("edit"), create: page("create") };
const freeze: PlacementNode = { kind: "run", action: FreezeAction };
const options = {
  pages,
  takesRecord: (action: unknown) => action === FreezeAction,
  link: (id: string, _to: unknown, recordId?: string) => `${id}:${recordId ?? "-"}`,
  placed: (_node: PlacementNode, index: number, ids: readonly string[] | undefined) => [
    `run_${index}:${ids?.join(",") ?? "-"}`,
  ],
  remove: (ids: readonly string[]) => `delete:${ids.join(",")}`,
};

describe("resourceActionsAt", () => {
  it("draws a row's links, its placed actions and its Delete in order", () => {
    expect(
      resourceActionsAt({
        ...options,
        place: ActionPlace.Row,
        record: { id: "ord_1" },
        placements: [freeze],
      }),
    ).toEqual(["view:ord_1", "edit:ord_1", "run_0:ord_1", "delete:ord_1"]);
  });

  it("draws Create in the list header unless a placement draws it, and no Delete there", () => {
    const header = { ...options, place: ActionPlace.ListHeader, record: undefined };
    expect(resourceActionsAt({ ...header, placements: [] })).toEqual(["create:-"]);
    expect(resourceActionsAt({ ...header, placements: [{ kind: "create" }] })).toEqual(["run_0:-"]);
  });
});
