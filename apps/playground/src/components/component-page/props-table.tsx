/**
 * Stackra file contract:
 * Purpose: `PropsTable`, one API table on @stackra/ui's Table: Prop (mono, required mark, deprecated chip) / Type
 *          (mono, wraps) / Default / Description with the source chip and the "replaces" note.
 * Boundary: prop names, types and defaults are code and stay left to right; a description is in the page's language
 *           (`useApiDoc` overlays the `api::` catalogue), its backticked code is a left-to-right `code` run, and its
 *           paragraph takes the direction of its own prose (`dir="auto"` skips the code runs), so English standing in
 *           for Arabic reads left to right.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (row 9) and 7.4.
 */
import { type ApiProp, codeSpans } from "@stackra/showcase";
import type { TableColumn } from "@stackra/ui/contracts";
import { Chip, Table, Text, useCatalogueText } from "@stackra/ui/react";

import { COMPONENT_PAGE_KEYS } from "#src/components/component-page/component-page-keys.constant";
import type { PropsTableProps } from "#src/components/component-page/props-table.props";
import { MESSAGES } from "#src/constants/messages.constant";

const K = COMPONENT_PAGE_KEYS.showcase.api;

/** The source chip's catalogue key per source. */
const SOURCE_KEYS = {
  stackra: K.source.stackra,
  heroui: K.source.heroui,
  "react-aria": K.source.react_aria,
} as const;

const code = (value: string) => (
  // `anywhere` lets a long type name break inside the cell, so the table fits its column instead of scrolling.
  // inline-block: a wrapped type keeps its own left-to-right lines (left-aligned) even in a right-to-left cell.
  <code dir="ltr" className="inline-block text-start font-mono text-xs [overflow-wrap:anywhere]">
    {value}
  </code>
);

/** One table of props, render props, events, animation options or a hook's return value. */
export function PropsTable({ label, rows, hasDefault = true }: PropsTableProps) {
  const t = useCatalogueText(MESSAGES.en);
  // A table with a header and no rows is an empty grid to assistive technology; say so in words instead.
  if (rows.length === 0)
    return (
      <Text type="small" tone="muted">
        {t(K.no_props)}
      </Text>
    );
  const columns: TableColumn[] = [
    { id: "name", label: t(K.prop), isRowHeader: true },
    { id: "type", label: t(K.type) },
    ...(hasDefault ? [{ id: "default", label: t(K.default) }] : []),
    { id: "description", label: t(K.description) },
  ];
  // A prop named like a column ("name", "type") would collide with that column id in React Aria's collection.
  const items = rows.map((row) => ({ ...row, id: `prop:${row.name}` }));
  return (
    <Table
      label={label}
      columns={columns}
      items={items}
      renderCell={(item: ApiProp & { id: string }, column) => {
        switch (column.id) {
          case "name": {
            return (
              <span className="flex min-w-28 flex-wrap items-center gap-1">
                {code(item.name)}
                {item.required ? (
                  <Chip size="sm" variant="soft" tone="accent">
                    {t(K.required)}
                  </Chip>
                ) : null}
                {item.deprecated ? (
                  <Chip size="sm" variant="soft" tone="warning">
                    {t(K.deprecated)}
                  </Chip>
                ) : null}
              </span>
            );
          }
          case "type": {
            // a floor for the type column, which `anywhere` would otherwise let the description squeeze to a sliver
            return <span className="block min-w-32">{code(item.type)}</span>;
          }
          case "default": {
            return item.default === undefined ? (
              <span className="text-muted">-</span>
            ) : (
              <span className="block min-w-20">{code(item.default)}</span>
            );
          }
          default: {
            return (
              <span className="grid min-w-48 gap-1 [overflow-wrap:anywhere]">
                {item.description ? (
                  <span dir="auto" className="text-start">
                    {codeSpans(item.description).map((span, index) =>
                      span.isCode ? (
                        // oxlint-disable-next-line react/no-array-index-key -- reason: the runs are a fixed split of one description string, never reordered or edited, and a code run may repeat, so its position is its only identity
                        <code key={index} dir="ltr" className="font-mono text-xs">
                          {span.text}
                        </code>
                      ) : (
                        span.text
                      ),
                    )}
                  </span>
                ) : null}
                <span className="flex flex-wrap gap-1">
                  <Chip size="sm" variant="soft">
                    {t(SOURCE_KEYS[item.source])}
                  </Chip>
                  {item.replaces ? (
                    <Chip size="sm" variant="soft" tone="accent">
                      {t(K.replaces, { prop: item.replaces })}
                    </Chip>
                  ) : null}
                </span>
              </span>
            );
          }
        }
      }}
    />
  );
}
