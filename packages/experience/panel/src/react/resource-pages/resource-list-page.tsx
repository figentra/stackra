/**
 * Stackra file contract:
 * Purpose: `ResourceListPage`, the generic List page of any resource, Filament-style: the title, the header actions
 *          (create and the placed list-header actions), and the list query's table with sort, filters, search, cursor
 *          pagination, row actions and the bulk bar.
 * Boundary: reads the resource's route constants and its registered tree (`resourceTreeOf`); a resource with no
 *           registered tree shows the row's own keys. Runs nothing itself: every button goes through the action
 *           runner. The resource's preset views (`views(v)`) and, with a `ViewStore`, the viewer's saved views draw as
 *           tabs over the one table (`SavedViewTabs` on the table's `useCollection` engine), the first tab being the
 *           list with no view; a preset tab reads with its fixed input (`includeMerged`) under the user's filters; a
 *           store that fails to read leaves the saved tabs out. A view's group and totals reach the engine; the
 *           non-table layouts are not drawn yet. The empty state takes the table's `empty` spec (title, description, icon,
 *           reason, heading level) and draws the actions placed at `empty` as `ActionButton`s with their look; a column
 *           marked `isEditable` writes through the resource's update action (its record id and the column's top-level
 *           key), a refusal shown on the cell.
 * Runtime: browser
 * Governing contract: ADR 0307 (rules 1 to 4, 9, 11 and 12); ADR 0164; ADR 0271 (decisions 1 and 7); ADR 0505; the
 *                     SDUI catalogue cases `emptyStates`, `actionButton` and `tableColumns` (STA-1981).
 */
import type { ActionRef, QueryRef } from "@stackra/clients";
import { useTranslation } from "@stackra/i18n/react";
import { EmptyState, PageHeader } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { ActionPlace } from "#core/enums/action-place.enum";
import { recordIdKey } from "#core/functions/record-id-key.function";
import { resourceLabel } from "#core/functions/resource-label.function";
import { resourceTreeOf } from "#core/functions/resource-tree-of.function";
import { specText } from "#core/functions/spec-text.function";
import { ActionButton } from "#react/action-button/action-button";
import { ActionRunStatus } from "#react/action-runner/action-run-status.enum";
import { useActionRunner } from "#react/action-runner/use-action-runner";
import type { ResourceListPageProps } from "#react/resource-pages/resource-list-page.props";
import { ResourceTable } from "#react/resource-pages/resource-table";
import { useResourceActions } from "#react/resource-pages/use-resource-actions";

/**
 * The List page of `resource`.
 *
 * @throws TypeError when the resource has no list query.
 * @example
 * <ResourceListPage resource={Resources.Order} />
 */
export function ResourceListPage({
  resource,
  pageSize = 25,
  views,
}: ResourceListPageProps): ReactElement {
  const { t } = useTranslation();
  const run = useActionRunner();
  const tree = resourceTreeOf(resource.key);
  const actions = useResourceActions(resource, tree);
  const list = resource.operations.list as QueryRef | undefined;
  if (list === undefined) throw new TypeError(`${resource.key} has no list query`);
  const title = t(resourceLabel(resource.key, "title"));
  const empty = actions.at(ActionPlace.Empty);
  const spec = tree.table?.empty;
  const words = (text: string | undefined) => (text === undefined ? undefined : specText(text, t));
  const update = resource.operations.update as ActionRef | undefined;
  const updateIdKey = update === undefined ? undefined : recordIdKey(update.input, resource.key);
  const edit =
    update !== undefined &&
    updateIdKey !== undefined &&
    (tree.table?.columns ?? []).some((column) => column.isEditable === true)
      ? { action: update, idKey: updateIdKey }
      : undefined;
  return (
    <>
      <PageHeader title={title} actions={actions.at(ActionPlace.ListHeader)} />
      {actions.modal}
      <ResourceTable
        resourceKey={resource.key}
        label={title}
        query={list}
        table={tree.table}
        pageSize={pageSize}
        views={views}
        presets={tree.views}
        rowActions={(row) => actions.at(ActionPlace.Row, row)}
        bulkActions={(ids) => actions.bulk(ids)}
        {...(edit === undefined
          ? {}
          : {
              onCellEdit: async (
                row: { readonly id: string },
                columnId: string,
                value: unknown,
              ) => {
                // Only a top-level key is written: the update input names the record and that key.
                const done = await run(edit.action, {
                  [edit.idKey]: row.id,
                  [columnId]: value,
                } as never);
                if (done.status === ActionRunStatus.Refused) throw done.error;
              },
            })}
        emptyState={
          <EmptyState
            title={words(spec?.title) ?? title}
            description={words(spec?.description)}
            icon={spec?.icon}
            reason={spec?.reason ?? "no-data"}
            headingLevel={spec?.headingLevel}
            actions={empty.map(({ id, label, onPress, icon, ...look }) => (
              <ActionButton
                key={id}
                {...look}
                {...(icon === undefined ? {} : { startIcon: icon })}
                onPress={onPress}
              >
                {label}
              </ActionButton>
            ))}
          />
        }
      />
    </>
  );
}
