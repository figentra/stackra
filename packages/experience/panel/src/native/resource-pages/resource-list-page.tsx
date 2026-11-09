/**
 * Stackra file contract:
 * Purpose: the native `ResourceListPage`, the generic List page of any resource on a phone, as on the web: the title,
 *          the header actions (create and the placed list-header actions), and the list query's rows with sort,
 *          filters, search, cursor paging, row actions, the bulk bar, the views as tabs and pull to refresh.
 * Boundary: reads the resource's route constants and its registered tree (`resourceTreeOf`); a resource with no
 *           registered tree shows the row's own keys. Runs nothing itself: every button goes through the native action
 *           runner. Every word is the panel catalogue's or the resource's own labels.
 * Runtime: react-native
 * Governing contract: ADR 0307 (rules 1 to 4, 9, 11 and 12); ADR 0164 (native parity); ADR 0271 (decisions 1 and 7);
 *          ADR 0505.
 */
import type { QueryRef } from "@stackra/clients";
import { useTranslation } from "@stackra/i18n/react";
import { Button, EmptyState, PageHeader } from "@stackra/ui/native";
import type { ReactElement } from "react";
import { View } from "react-native";

import { ActionPlace } from "#core/enums/action-place.enum";
import { resourceLabel } from "#core/functions/resource-label.function";
import { resourceTreeOf } from "#core/functions/resource-tree-of.function";
import type { ResourceListPageProps } from "#native/resource-pages/resource-list-page.props";
import { ResourceTable } from "#native/resource-pages/resource-table";
import { useResourceActions } from "#native/resource-pages/use-resource-actions";

/**
 * The native List page of `resource`.
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
  const tree = resourceTreeOf(resource.key);
  const actions = useResourceActions(resource, tree);
  const list = resource.operations.list as QueryRef | undefined;
  if (list === undefined) throw new TypeError(`${resource.key} has no list query`);
  const title = t(resourceLabel(resource.key, "title"));
  const empty = actions.at(ActionPlace.Empty);
  return (
    <View className="flex-1 gap-4">
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
    </View>
  );
}
