/**
 * Stackra file contract:
 * Purpose: `ResourceViewPage`, the generic View page of any resource: the title, the header actions (edit, the placed
 *          View actions run through the action runner, delete), the record's entries and sections, and its relation
 *          managers; a list entry's cells format like any value, a `…Minor` cell as money (`listCellCurrency`).
 * Boundary: reads the record with the get query (`useRecord`) and the registered tree; a resource with no infolist
 *           shows the record's own keys. A section's `aside` is drawn in the main column (no side column yet). The
 *           built-in View as JSON, clone and activity tab (ADR 0334 rules 9 to 11) are not built.
 * Runtime: browser
 * Governing contract: ADR 0307 (rules 3 and 4); ADR 0164.
 */
import { useTranslation } from "@stackra/i18n/react";
import {
  ErrorState,
  PageHeader,
  PageSkeleton,
  PropertyList,
  Section,
  Table,
} from "@stackra/ui/react";
import type { ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { ActionPlace } from "#core/enums/action-place.enum";
import { entryRowsOf } from "#core/functions/entry-rows-of.function";
import { resourceLabel } from "#core/functions/resource-label.function";
import { resourceTreeOf } from "#core/functions/resource-tree-of.function";
import type { EntryNode } from "#core/types/entry-node.type";
import { RelationManager } from "#react/resource-pages/relation-manager";
import { ResourceValue } from "#react/resource-pages/resource-value";
import type { ResourceViewPageProps } from "#react/resource-pages/resource-view-page.props";
import { useRecord } from "#react/resource-pages/use-record";
import { useResourceActions } from "#react/resource-pages/use-resource-actions";

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
 * The View page of `resource`.
 *
 * @example
 * <ResourceViewPage resource={Resources.Order} />
 */
export function ResourceViewPage({ resource, id }: ResourceViewPageProps): ReactElement {
  const { t } = useTranslation();
  const tree = resourceTreeOf(resource.key);
  const actions = useResourceActions(resource, tree);
  const { answer } = useRecord(resource, id);
  const title = t(resourceLabel(resource.key, "title"));
  if (answer.isPending) return <PageSkeleton loadingLabel={title} />;
  if (answer.error !== null || typeof answer.data !== "object" || answer.data === null)
    return (
      <ErrorState
        title={t(PANEL_KEYS.panel.resources.failed)}
        error={answer.error}
        retry={{ label: t(PANEL_KEYS.panel.resources.retry), onPress: () => void answer.refetch() }}
      />
    );
  const record = answer.data;
  return (
    <>
      <PageHeader title={title} actions={actions.at(ActionPlace.View, record)} />
      {actions.modal}
      <Entries
        resourceKey={resource.key}
        entries={tree.infolist?.entries ?? derived(record)}
        record={record}
      />
      {(tree.relations ?? []).map((relation, index) => (
        <RelationManager
          // oxlint-disable-next-line react/no-array-index-key -- reason: the items have no identity but their place in the list
          key={index}
          resourceKey={resource.key}
          relation={relation}
          record={record}
        />
      ))}
    </>
  );
}
