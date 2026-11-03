/**
 * Stackra file contract:
 * Purpose: `DocumentPage`, a panel `Document({ kind, blocks })` drawn on the web: its title, then its blocks. A
 *          Dashboard lays its widget tiles on the 12-column grid by each tile's size, under one range picker when it
 *          declares one; a Page draws its query tables, widget tiles and registered blocks in its layout (`stack` at full
 *          width, `single_column` in one readable column).
 * Boundary: a widget block draws the registered widget whose class it names (`registerWidgets`), its size overriding
 *           the widget's own; a table block draws the generic resource table over its list query with its columns; a
 *           custom block draws through experience's `DocumentRenderer` under the key it was registered with
 *           (`registerBlocks`). A block whose widget or block is not registered draws nothing, so one missing
 *           registration does not take the page down.
 * Runtime: browser
 * Governing contract: ADR 0307 (rule 20: a Dashboard places widget classes only); ADR 0110; ADR 0270 (decision 3);
 *                     the SDUI catalogue case `pages` (panel Document pages), build-list item 53 (STA-1981).
 */
import type { QueryRef } from "@stackra/clients";
import { kindOf } from "@stackra/container";
import { Enum } from "@stackra/contracts";
import { registeredBlocks } from "@stackra/experience";
import { ExperienceKind } from "@stackra/experience/contracts";
import { DocumentRenderer } from "@stackra/experience/react";
import { useTranslation } from "@stackra/i18n/react";
import { PageHeader, Select } from "@stackra/ui/react";
import { useState, type ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { WIDGET_REGISTRY } from "#core/constants/widget-registry.constant";
import { Count } from "#core/enums/count.enum";
import { DocumentLayout } from "#core/enums/document-layout.enum";
import { TimeRange } from "#core/enums/time-range.enum";
import { WidgetSize } from "#core/enums/widget-size.enum";
import { documentLabel } from "#core/functions/document-label.function";
import type { DocumentOptions } from "#core/types/document-options.type";
import type { PanelBlockNode } from "#core/types/panel-block-node.type";
import type { DocumentPageProps } from "#react/document-page/document-page.props";
import { ResourceTable } from "#react/resource-pages/resource-table";
import { WidgetTile } from "#react/widget-tile/widget-tile";

/** The grid class of a tile spanning `columns` of 12. */
const SPAN: Readonly<Record<number, string>> = Object.freeze({
  3: "lg:col-span-3",
  6: "lg:col-span-6",
  9: "lg:col-span-9",
  12: "lg:col-span-12",
});

/** The rows a page's query table shows at once. */
const PAGE_SIZE = 25;

/** One block of the document. */
function DocumentBlock({
  block,
  title,
  range,
}: {
  readonly block: PanelBlockNode;
  readonly title: string;
  readonly range: TimeRange | undefined;
}): ReactElement | null {
  if (block.kind === "widget") {
    const registered = WIDGET_REGISTRY.find((widget) => widget.widget === block.widget);
    if (registered === undefined) return null;
    const widget = block.size === undefined ? registered : { ...registered, size: block.size };
    return (
      <div className={SPAN[Enum.meta(WidgetSize, widget.size).columns]}>
        <WidgetTile widget={widget} {...(range === undefined ? {} : { range })} />
      </div>
    );
  }
  if (block.kind === "table") {
    const query = block.query as QueryRef;
    // The list query's key is `<module>.<model>.list@n`; the table's labels are that resource's.
    const resourceKey = query.key.split(".").slice(0, 2).join(".");
    return (
      <div className={SPAN[12]}>
        <ResourceTable
          resourceKey={resourceKey}
          label={title}
          query={query}
          {...(block.params === undefined ? {} : { input: block.params })}
          table={{
            columns: block.columns.map((key) => ({ kind: "value", key })),
            filters: [],
            count: Count.Estimated,
          }}
          pageSize={PAGE_SIZE}
          searchable={false}
        />
      </div>
    );
  }
  const key = [...registeredBlocks()].find(([, type]) => type === block.block)?.[0];
  if (key === undefined) return null;
  return (
    <div className={SPAN[12]}>
      <DocumentRenderer document={{ block: key, props: block.props }} />
    </div>
  );
}

/**
 * The page of the document `document` at `route`.
 *
 * @throws TypeError when `document` is not a `Document({ ... })` class.
 * @example
 * <DocumentPage document={SalesOverviewDocument} route={Resources.SalesOverview} />
 */
export function DocumentPage({ document, route }: DocumentPageProps): ReactElement {
  const { t } = useTranslation();
  const record = kindOf(document);
  if (record?.kind !== "document")
    throw new TypeError(`${document.name} does not extend Document({ kind, blocks })`);
  const options = record.options as unknown as DocumentOptions;
  const [range, setRange] = useState<TimeRange | undefined>(options.range?.default);
  const isDashboard = options.kind === ExperienceKind.Dashboard;
  const choices = (options.range?.ranges ?? []).filter((code) => code !== TimeRange.Custom);
  const picker =
    isDashboard && choices.length > 0 ? (
      <Select
        label={t(PANEL_KEYS.panel.widgets.range)}
        items={choices.map((code) => ({ id: code, label: t(PANEL_KEYS.panel.time_range[code]) }))}
        value={range ?? null}
        onChange={(code) => setRange((code as TimeRange | null) ?? options.range?.default)}
      />
    ) : undefined;
  const title = t(documentLabel(route.key, "title"));
  const narrow = !isDashboard && options.layout === DocumentLayout.SingleColumn;
  return (
    <>
      <PageHeader title={title} {...(picker === undefined ? {} : { endContent: picker })} />
      <div
        className={narrow ? "mx-auto grid max-w-3xl gap-4" : "grid gap-4 lg:grid-cols-12"}
        data-document={route.key}
      >
        {options.blocks.map((block, index) => (
          <DocumentBlock
            // A document's blocks are fixed by its class, so their order is their identity.
            // oxlint-disable-next-line react/no-array-index-key -- reason: blocks have no key and never reorder
            key={index}
            block={block}
            title={title}
            range={isDashboard ? range : undefined}
          />
        ))}
      </div>
    </>
  );
}
