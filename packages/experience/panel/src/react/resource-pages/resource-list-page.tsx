/**
 * Stackra file contract:
 * Purpose: `ResourceListPage`, the generic List page of any resource, Filament-style: the title, the header actions
 *          (create and the placed list-header actions), and the list query's table with sort, filters, search, cursor
 *          pagination, row actions and the bulk bar.
 * Boundary: reads the resource's route constants and its registered tree (`resourceTreeOf`); a resource with no
 *           registered tree shows the row's own keys. Runs nothing itself: every button goes through the action
 *           runner. Saved views and grouping (`SavedView`, `groupRows`) are not drawn yet.
 * Runtime: browser
 * Governing contract: ADR 0307 (rules 1 to 4, 11 and 12); ADR 0164.
 */
import type { QueryRef } from "@stackra/clients";
import { useTranslation } from "@stackra/i18n/react";
import { Button, EmptyState, PageHeader } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { ActionPlace } from "#core/enums/action-place.enum";
import { resourceLabel } from "#core/functions/resource-label.function";
import { resourceTreeOf } from "#core/functions/resource-tree-of.function";
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
export function ResourceListPage({ resource, pageSize = 25 }: ResourceListPageProps): ReactElement {
  const { t } = useTranslation();
  const tree = resourceTreeOf(resource.key);
  const actions = useResourceActions(resource, tree);
  const list = resource.operations.list as QueryRef | undefined;
  if (list === undefined) throw new TypeError(`${resource.key} has no list query`);
  const title = t(resourceLabel(resource.key, "title"));
  const empty = actions.at(ActionPlace.Empty);
  return (
    <>
      <PageHeader title={title} actions={actions.at(ActionPlace.ListHeader)} />
      <ResourceTable
        resourceKey={resource.key}
        label={title}
        query={list}
        table={tree.table}
        pageSize={pageSize}
        rowActions={(row) => actions.at(ActionPlace.Row, row)}
        bulkActions={(ids) => actions.bulk(ids)}
        emptyState={
          <EmptyState
            title={title}
            reason="no-data"
            actions={empty.map((action) => (
              <Button key={action.id} onPress={() => void action.onPress?.()}>
                {action.label}
              </Button>
            ))}
          />
        }
      />
    </>
  );
}
