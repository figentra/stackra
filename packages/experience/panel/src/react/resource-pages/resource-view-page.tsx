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
import type { ReactElement, ReactNode } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { ActionPlace } from "#core/enums/action-place.enum";
import { listCellCurrency } from "#core/functions/list-cell-currency.function";
import { resourceLabel } from "#core/functions/resource-label.function";
import { resourceTreeOf } from "#core/functions/resource-tree-of.function";
import { valueAt } from "#core/functions/value-at.function";
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
  const rows: { id: string; label: string; value: ReactNode }[] = [];
  const sections: ReactElement[] = [];
  for (const entry of entries) {
    if (entry.kind === "section") {
      sections.push(
        <Section key={entry.name} title={t(resourceLabel(resourceKey, "sections", entry.name))}>
          <Entries resourceKey={resourceKey} entries={entry.entries} record={record} />
        </Section>,
      );
      continue;
    }
    const label = t(resourceLabel(resourceKey, "entries", entry.key));
    const value = valueAt(record, entry.key);
    rows.push({
      id: entry.key,
      label,
      value:
        entry.kind === "list" ? (
          <Table
            label={label}
            columns={entry.columns.map((column) => ({
              id: column,
              label: t(resourceLabel(resourceKey, "entries", `${entry.key}.${column}`)),
            }))}
            items={(Array.isArray(value) ? (value as object[]) : []).map((item, index) => ({
              ...item,
              id: String(index),
            }))}
            renderCell={(item, column) => {
              const currency = listCellCurrency(item, column.id, record, entry.currency);
              return (
                <ResourceValue
                  resourceKey={resourceKey}
                  path={column.id}
                  kind={currency === undefined ? "value" : "money"}
                  value={valueAt(item, column.id)}
                  currency={currency}
                />
              );
            }}
          />
        ) : (
          <ResourceValue
            resourceKey={resourceKey}
            path={entry.key}
            kind={entry.kind}
            value={value}
            currency={entry.kind === "money" ? valueAt(record, entry.currency) : undefined}
            labels={entry.kind === "value" ? entry.labels : undefined}
          />
        ),
    });
  }
  return (
    <>
      {rows.length > 0 && <PropertyList items={rows} />}
      {sections}
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
