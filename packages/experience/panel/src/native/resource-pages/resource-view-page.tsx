/**
 * Stackra file contract:
 * Purpose: the native `ResourceViewPage`, the generic View page of any resource on a phone, as on the web: the title,
 *          the header actions (edit, the placed View actions run through the action runner, delete), and the record's
 *          entries and sections; a list entry's cells format like any value, a `…Minor` cell as money
 *          (`listCellCurrency`). Pull to refresh reads the record again.
 * Boundary: reads the record with the get query (`useRecord`, the native `useQuery`) and the registered tree; a
 *           resource with no infolist shows the record's own keys. A section's `aside` is drawn in the one column.
 *           shortcut: the relation managers are not drawn on native yet; add them when a native screen needs a child
 *           list under its record.
 * Runtime: react-native
 * Governing contract: ADR 0307 (rules 3 and 4); ADR 0164 (native parity).
 */
import { useTranslation } from "@stackra/i18n/react";
import {
  ErrorState,
  PageHeader,
  PageSkeleton,
  PropertyList,
  PullToRefresh,
  Section,
  Table,
} from "@stackra/ui/native";
import type { ReactElement } from "react";
import { View } from "react-native";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { answerFailureOf } from "#core/functions/answer-failure-of.function";
import { ActionPlace } from "#core/enums/action-place.enum";
import { entryRowsOf } from "#core/functions/entry-rows-of.function";
import { resourceLabel } from "#core/functions/resource-label.function";
import { resourceTreeOf } from "#core/functions/resource-tree-of.function";
import type { EntryNode } from "#core/types/entry-node.type";
import { ResourceValue } from "#native/resource-pages/resource-value";
import type { ResourceViewPageProps } from "#native/resource-pages/resource-view-page.props";
import { useRecord } from "#native/resource-pages/use-record";
import { useResourceActions } from "#native/resource-pages/use-resource-actions";

/** The entries a resource without an infolist shows: the record's own keys. */
const derived = (record: object): EntryNode[] =>
  Object.keys(record).map((key) => ({ kind: "value", key }));

/** The entries of one level, then each section under its title. */
function Entries({
  resourceKey,
  entries,
  record,
}: {
  readonly resourceKey: string;
  readonly entries: readonly EntryNode[];
  readonly record: object;
}): ReactElement {
  const { t } = useTranslation();
  const { rows, sections } = entryRowsOf(resourceKey, entries, record, t);
  return (
    <>
      {rows.length > 0 && (
        <PropertyList
          items={rows.map(({ id, label, cell, list }) => ({
            id,
            label,
            value:
              list === undefined ? (
                <ResourceValue {...cell} />
              ) : (
                <Table
                  label={label}
                  scrollEnabled={false}
                  columns={list.columns}
                  items={list.items}
                  renderCell={(item, column) => <ResourceValue {...list.cell(item, column.id)} />}
                />
              ),
          }))}
        />
      )}
      {sections.map((section) => (
        <Section key={section.name} title={section.title}>
          <Entries resourceKey={resourceKey} entries={section.entries} record={record} />
        </Section>
      ))}
    </>
  );
}

/**
 * The native View page of `resource`'s record `id`.
 *
 * @throws TypeError when the resource has no get query or no id is given.
 * @example
 * <ResourceViewPage resource={Resources.Order} id={params.id} />
 */
export function ResourceViewPage({ resource, id }: ResourceViewPageProps): ReactElement {
  const { t } = useTranslation();
  const tree = resourceTreeOf(resource.key);
  const actions = useResourceActions(resource, tree);
  const { answer } = useRecord(resource, id);
  const title = t(resourceLabel(resource.key, "title"));
  if (answer.isPending) return <PageSkeleton loadingLabel={title} />;
  if (answer.error !== null || typeof answer.data !== "object" || answer.data === null)
    return <ErrorState {...answerFailureOf(answer, PANEL_KEYS.panel.resources, t)} />;
  const record = answer.data;
  return (
    <PullToRefresh
      onRefresh={async () => {
        await answer.refetch();
      }}
      isRefreshing={answer.isFetching}
    >
      <View className="gap-4">
        <PageHeader title={title} actions={actions.at(ActionPlace.View, record)} />
        {actions.modal}
        <Entries
          resourceKey={resource.key}
          entries={tree.infolist?.entries ?? derived(record)}
          record={record}
        />
      </View>
    </PullToRefresh>
  );
}
