/**
 * Stackra file contract:
 * Purpose: `useResourceActions(resource, tree)`, the buttons a resource page draws at one place, as `@stackra/ui`
 *          `ResourceAction`s: the placed actions run through the action runner (a record action filled with the
 *          record's id, a bulk action fanned out per selected record, an action whose input needs more than the id
 *          through its modal form) plus the derived operations (view and edit links, delete, the create link).
 * Boundary: internal to the resource pages. Reads the recorded placements (`placementsAt`) and the resource's
 *           operation refs; every run goes through `useActionRunner`, so the declared confirmation, the cache refresh
 *           and the toasts are the runner's. The page draws `modal`, the open `ActionInputModal`. `bound` inputs (a
 *           relation manager's parent id) go into every run and are never asked for. Export and import placements are
 *           not drawn (their queued pipelines are not built). A placement's `ActionButtonSpec` look rides along: its
 *           menu fields (icon, description, shortcut, tone, disabled reason, link) on the action, its button fields
 *           (variant, size, end icon, full width) for a page that draws an `ActionButton`; it is hidden without its
 *           permission (`useCan`) or, on a record's place, while its `visibleWhen` is not true; its `confirm` replaces
 *           the declared confirmation; a link runs nothing. The table's bulk `runMode` `once` sends the selection in the
 *           input's list of ids (`orderIds`, `ids`) in one run, where the input has one; else it fans out. A run's id is its
 *           action key, which a `RowActionsSpec` section names.
 * Runtime: browser
 * Governing contract: ADR 0307 (rules 3 and 4); ADR 0139 (declared confirmation); the SDUI catalogue cases
 *                     `actionButton`, `rowActions` and `bulkActions` (STA-1981).
 */
import type { ActionRef } from "@stackra/clients";
import type { AnyClass } from "@stackra/container";
import { useTranslation } from "@stackra/i18n/react";
import { useNavigate } from "@stackra/navigation/react";
import { useState } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { ActionPlace } from "#core/enums/action-place.enum";
import { actionFormKeys } from "#core/functions/action-form-keys.function";
import { actionLabelKey } from "#core/functions/action-label-key.function";
import { idOf } from "#core/functions/id-of.function";
import { placementsAt } from "#core/functions/placements-at.function";
import { recordIdKey } from "#core/functions/record-id-key.function";
import { resourceActionLook } from "#core/functions/resource-action-look.function";
import { shownWhen } from "#core/functions/shown-when.function";
import { specText } from "#core/functions/spec-text.function";
import type { PlacementNode } from "#core/types/placement-node.type";
import type { ResourceRoutes } from "#core/types/resource-routes.type";
import type { ResourceTree } from "#core/types/resource-tree.type";
import type { PageRef } from "#core/types/page-ref.type";
import { useActionRunner } from "#react/action-runner/use-action-runner";
import { useCan } from "#react/action-runner/use-can";
import { ActionInputModal } from "#react/resource-pages/action-input-modal";
import type { PlacedAction } from "#react/resource-pages/placed-action.type";
import type { ResourceActions } from "#react/resource-pages/resource-actions.type";

/** The resource page refs, read loosely (each exists only when the resource declares it). */
type Pages = { readonly view?: PageRef; readonly edit?: PageRef; readonly create?: PageRef };

/** A placed button's look: its menu fields and the button fields a page draws. */
const lookOf = (node: PlacementNode): Omit<PlacedAction, "id" | "label" | "onPress"> => ({
  ...resourceActionLook(node),
  ...(node.variant === undefined ? {} : { variant: node.variant }),
  ...(node.size === undefined ? {} : { size: node.size }),
  ...(node.endIcon === undefined ? {} : { endIcon: node.endIcon }),
  ...(node.isFullWidth === undefined ? {} : { isFullWidth: node.isFullWidth }),
  ...(node.shortcutId === undefined ? {} : { shortcutId: node.shortcutId }),
  ...(node.isLoading === undefined ? {} : { isLoading: node.isLoading }),
});

/** The input key a `once` run sends the selection in (`orderIds`, `ids`), when the input has one. */
const listKeyOf = (action: ActionRef, resourceKey: string): string | undefined => {
  const shape =
    (action.input as { readonly shape?: Readonly<Record<string, unknown>> } | undefined)?.shape ??
    {};
  const model = resourceKey.slice(resourceKey.indexOf(".") + 1);
  const camel = model.replaceAll(/_([a-z0-9])/g, (_, letter: string) => letter.toUpperCase());
  const last = model.slice(model.lastIndexOf("_") + 1);
  return [`${camel}Ids`, `${last}Ids`, "ids"].find((key) => key in shape);
};

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
  bound: Readonly<Record<string, unknown>> = {},
): ResourceActions {
  const { t } = useTranslation();
  const run = useActionRunner();
  const can = useCan();
  const navigate = useNavigate();
  const pages = resource as ResourceRoutes & Pages;
  const idKey = (action: AnyClass) => recordIdKey((action as ActionRef).input, resource.key);
  const remove = tree.options?.operations.delete;
  const removeRef = typeof remove === "function" ? (remove as ActionRef) : undefined;
  const placed = (tree.actions ?? []).filter((node) => can(node.permission));
  const once = tree.table?.bulkActions?.runMode === "once";
  const [pending, setPending] = useState<
    | {
        readonly action: ActionRef;
        readonly idKey: string | undefined;
        readonly ids: readonly string[] | undefined;
        readonly record: object | undefined;
        readonly keys: readonly string[];
      }
    | undefined
  >();

  /** A button that runs `action` once per id in `ids` (or once over them all), or once with no record. */
  const runner = (
    action: ActionRef,
    ids: readonly string[] | undefined,
    id: string,
    record?: object,
    node?: PlacementNode,
    isBulk = false,
  ): PlacedAction => {
    const look = node === undefined ? {} : lookOf(node);
    const label =
      node?.label === undefined
        ? t(actionLabelKey(resource.key, action.key))
        : specText(node.label, t);
    // A link goes where it points and runs nothing.
    if (node?.href !== undefined) return { ...look, id, label };
    const confirm = node?.confirm;
    // The spec's own confirmation goes with every run; without one the runner asks the declared one.
    const send = (input: Readonly<Record<string, unknown>>) =>
      confirm === undefined
        ? run(action, input as never)
        : run(action, input as never, { confirm });
    return {
      ...look,
      id,
      label,
      onPress: async () => {
        const key = ids === undefined ? undefined : idKey(action);
        // A `once` bulk run sends the whole selection in the input's list of ids.
        const list = isBulk && once ? listKeyOf(action, resource.key) : undefined;
        // An input that needs more than the id opens one modal form for every record, or once without a record
        // (ADR 0307 rule 3).
        // A bound input (a relation's parent id) is filled in, never asked for.
        const keys = actionFormKeys(action.input, key).filter(
          (field) => !Object.hasOwn(bound, field) && field !== list,
        );
        if (keys.length > 0) {
          setPending({ action, idKey: key, ids, record, keys });
          return;
        }
        if (list !== undefined && ids !== undefined) {
          await send({ ...bound, [list]: ids });
          return;
        }
        if (ids === undefined || key === undefined) {
          await send(bound);
          return;
        }
        // A bulk run fans out per record, so the policy decides each one (ADR 0307 rule 3).
        for (const recordId of ids) await send({ ...bound, [key]: recordId });
      },
    };
  };

  const link = (id: string, label: string, to: PageRef, recordId?: string): PlacedAction => ({
    id,
    label,
    onPress: () => navigate(to, recordId === undefined ? {} : { id: recordId }),
  });

  return {
    modal:
      pending === undefined ? null : (
        <ActionInputModal
          resourceKey={resource.key}
          action={pending.action}
          idKey={pending.idKey}
          ids={pending.ids}
          record={pending.record}
          bound={bound}
          keys={pending.keys}
          onClose={() => setPending(undefined)}
        />
      ),
    at(place, record) {
      const ids = record === undefined ? undefined : [idOf(record)];
      const out: PlacedAction[] = [];
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
      placementsAt(placed, place, (action) => idKey(action) !== undefined)
        // A record predicate reads the record; a place without one ignores it.
        .filter((node) => record === undefined || shownWhen(node.visibleWhen, record))
        .forEach((node) => {
          if (node.kind === "create" && pages.create !== undefined)
            out.push({
              ...link("create", t(PANEL_KEYS.panel.resources.create), pages.create),
              ...lookOf(node),
            });
          if (node.kind === "run")
            out.push(
              runner(node.action as ActionRef, ids, (node.action as ActionRef).key, record, node),
            );
        });
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
      ).flatMap((node) =>
        node.kind === "run"
          ? [
              runner(
                node.action as ActionRef,
                ids,
                (node.action as ActionRef).key,
                undefined,
                node,
                true,
              ),
            ]
          : [],
      );
      if (removeRef !== undefined)
        out.push({
          ...runner(removeRef, ids, "delete", undefined, undefined, true),
          label: t(PANEL_KEYS.panel.resources.delete),
          tone: "danger",
        });
      return out;
    },
  };
}
