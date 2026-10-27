/**
 * Stackra file contract:
 * Purpose: `useResourceActions(resource, tree)`, the buttons a resource page draws at one place, as `@stackra/ui`
 *          `ResourceAction`s: the placed actions run through the action runner (a record action filled with the
 *          record's id, a bulk action fanned out per selected record) plus the derived operations (view and edit links,
 *          delete, the create link).
 * Boundary: internal to the resource pages. Reads the recorded placements (`placementsAt`) and the resource's
 *           operation refs; every run goes through `useActionRunner`, so the declared confirmation, the cache refresh
 *           and the toasts are the runner's. An action whose input needs more than the record id is sent with the id
 *           only and the server refuses it (the modal form of ADR 0307 rule 3 is not built). Export and import
 *           placements are not drawn (their queued pipelines are not built).
 * Runtime: browser
 * Governing contract: ADR 0307 (rules 3 and 4); ADR 0139 (declared confirmation).
 */
import type { ActionRef } from "@stackra/clients";
import type { AnyClass } from "@stackra/container";
import { useTranslation } from "@stackra/i18n/react";
import { useNavigate } from "@stackra/navigation/react";
import type { ResourceAction } from "@stackra/ui/contracts";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { ActionPlace } from "#core/enums/action-place.enum";
import { idOf } from "#core/functions/id-of.function";
import { placementsAt } from "#core/functions/placements-at.function";
import { recordIdKey } from "#core/functions/record-id-key.function";
import { resourceLabel } from "#core/functions/resource-label.function";
import type { ResourceRoutes } from "#core/types/resource-routes.type";
import type { ResourceTree } from "#core/types/resource-tree.type";
import type { PageRef } from "#core/types/page-ref.type";
import { useActionRunner } from "#react/action-runner/use-action-runner";
import type { ResourceActions } from "#react/resource-pages/resource-actions.type";

/** The verb of an action key (`orders.order.cancel@1` is `cancel`). */
const verbOf = (key: string): string => key.replace(/@\d+$/, "").split(".").pop() ?? key;

/** The resource page refs, read loosely (each exists only when the resource declares it). */
type Pages = { readonly view?: PageRef; readonly edit?: PageRef; readonly create?: PageRef };

/**
 * The buttons of `resource` under its recorded `tree`.
 *
 * @example
 * const actions = useResourceActions(Resources.Order, resourceTreeOf("orders.order"));
 * <DataTable rowActions={(row) => actions.at(ActionPlace.Row, row)} bulkActions={actions.bulk(selected)} />
 */
export function useResourceActions(
  resource: ResourceRoutes,
  tree: Partial<ResourceTree>,
): ResourceActions {
  const { t } = useTranslation();
  const run = useActionRunner();
  const navigate = useNavigate();
  const pages = resource as ResourceRoutes & Pages;
  const idKey = (action: AnyClass) => recordIdKey((action as ActionRef).input, resource.key);
  const remove = tree.options?.operations.delete;
  const removeRef = typeof remove === "function" ? (remove as ActionRef) : undefined;
  const placed = tree.actions ?? [];

  /** A button that runs `action` once per id in `ids`, or once with no record. */
  const runner = (
    action: ActionRef,
    ids: readonly string[] | undefined,
    id: string,
  ): ResourceAction => ({
    id,
    label: t(resourceLabel(resource.key, "actions", verbOf(action.key))),
    onPress: async () => {
      const key = idKey(action);
      if (ids === undefined || key === undefined) {
        await run(action, {} as never);
        return;
      }
      // A bulk run fans out per record, so the policy decides each one (ADR 0307 rule 3).
      for (const recordId of ids) await run(action, { [key]: recordId } as never);
    },
  });

  const link = (id: string, label: string, to: PageRef, recordId?: string): ResourceAction => ({
    id,
    label,
    onPress: () => navigate(to, recordId === undefined ? {} : { id: recordId }),
  });

  return {
    at(place, record) {
      const ids = record === undefined ? undefined : [idOf(record)];
      const out: ResourceAction[] = [];
      const recordId = ids?.[0];
      if (place === ActionPlace.Row && recordId !== undefined && pages.view !== undefined)
        out.push(link("view", t(PANEL_KEYS.panel.resources.view), pages.view, recordId));
      if (
        (place === ActionPlace.Row || place === ActionPlace.View) &&
        recordId !== undefined &&
        pages.edit !== undefined
      )
        out.push(link("edit", t(PANEL_KEYS.panel.resources.edit), pages.edit, recordId));
      if (
        (place === ActionPlace.ListHeader || place === ActionPlace.Empty) &&
        pages.create !== undefined &&
        !placed.some((node) => node.kind === "create")
      )
        out.push(link("create", t(PANEL_KEYS.panel.resources.create), pages.create));
      placementsAt(placed, place, (action) => idKey(action) !== undefined).forEach(
        (node, index) => {
          if (node.kind === "create" && pages.create !== undefined)
            out.push(link("create", t(PANEL_KEYS.panel.resources.create), pages.create));
          if (node.kind === "run") out.push(runner(node.action as ActionRef, ids, `run_${index}`));
        },
      );
      if (
        removeRef !== undefined &&
        recordId !== undefined &&
        (place === ActionPlace.Row || place === ActionPlace.View)
      )
        out.push({
          ...runner(removeRef, ids, "delete"),
          label: t(PANEL_KEYS.panel.resources.delete),
          tone: "danger",
        });
      return out;
    },
    bulk(ids) {
      const out = placementsAt(
        placed,
        ActionPlace.Bulk,
        (action) => idKey(action) !== undefined,
      ).flatMap((node, index) =>
        node.kind === "run" ? [runner(node.action as ActionRef, ids, `bulk_${index}`)] : [],
      );
      if (removeRef !== undefined)
        out.push({
          ...runner(removeRef, ids, "delete"),
          label: t(PANEL_KEYS.panel.resources.delete),
          tone: "danger",
        });
      return out;
    },
  };
}
