/**
 * Stackra file contract:
 * Purpose: the native `useResourceActions(resource, tree)`, the buttons a native resource page draws at one place, as
 *          `@stackra/ui` `ResourceAction`s, as on the web: the placed actions run through the native action runner (a
 *          record action filled with the record's id, a bulk action fanned out per selected record, an action whose
 *          input needs more than the id through its modal form) plus the derived operations (view and edit links,
 *          delete, the create link).
 * Boundary: internal to the native resource pages. Reads the recorded placements (`placementsAt`) and the resource's
 *           operation refs; every run goes through the native `useActionRunner`. The links push the resource's page by
 *           name with the native `useNavigate`, so the host registers screens under those names (`orders.order.view`)
 *           until gen does. The page draws `modal`, the open `ActionInputModal`. Export and import placements are not
 *           drawn (their queued pipelines are not built).
 * Runtime: react-native
 * Governing contract: ADR 0307 (rules 3 and 4); ADR 0139 (declared confirmation); ADR 0164 (native parity).
 */
import type { ActionRef } from "@stackra/clients";
import type { AnyClass } from "@stackra/container";
import { useTranslation } from "@stackra/i18n/react";
import { useNavigate } from "@stackra/navigation/native";
import type { ResourceAction } from "@stackra/ui/contracts";
import { useState } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { ActionPlace } from "#core/enums/action-place.enum";
import { actionFormKeys } from "#core/functions/action-form-keys.function";
import { actionLabelKey } from "#core/functions/action-label-key.function";
import { idOf } from "#core/functions/id-of.function";
import { placementsAt } from "#core/functions/placements-at.function";
import { recordIdKey } from "#core/functions/record-id-key.function";
import type { PageRef } from "#core/types/page-ref.type";
import type { ResourceRoutes } from "#core/types/resource-routes.type";
import type { ResourceTree } from "#core/types/resource-tree.type";
import { useActionRunner } from "#native/action-runner/use-action-runner";
import { ActionInputModal } from "#native/resource-pages/action-input-modal";
import type { ResourceActions } from "#react/resource-pages/resource-actions.type";

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

  /** A button that runs `action` once per id in `ids`, or once with no record. */
  const runner = (
    action: ActionRef,
    ids: readonly string[] | undefined,
    id: string,
    record?: object,
  ): ResourceAction => ({
    id,
    label: t(actionLabelKey(resource.key, action.key)),
    onPress: async () => {
      const key = ids === undefined ? undefined : idKey(action);
      // An input that needs more than the id opens one modal form for every record (ADR 0307 rule 3).
      const keys = actionFormKeys(action.input, key);
      if (keys.length > 0) {
        setPending({ action, idKey: key, ids, record, keys });
        return;
      }
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
    onPress: () => navigate.to(to, recordId === undefined ? {} : { id: recordId }),
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
          keys={pending.keys}
          onOpenChange={(isOpen) => {
            if (!isOpen) setPending(undefined);
          }}
        />
      ),
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
          if (node.kind === "run")
            out.push(runner(node.action as ActionRef, ids, `run_${index}`, record));
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
