/**
 * Stackra file contract:
 * Purpose: `ResourceCell`, one list cell drawn as its column's `cell` kind: the value as text (`ResourceValue`, the
 *          default), a badge or a status badge in the column's tone for the value, money, a principal, a date, a link to
 *          the value, or the value with a copy button (also for a `copyable` column).
 * Boundary: internal to the resource pages; composition of @stackra/ui's `Badge`, `StatusBadge`, `DateLabel`, `Link` and
 *           `CopyButton` over `ResourceValue`, so an enum code still shows by its label. A value the kind cannot show
 *           (a date that does not parse, a link that is not text) falls back to the text.
 * Runtime: browser
 * Governing contract: ADR 0307 (rules 1 and 13: the cell kinds are a closed set); ADR 0504; the SDUI catalogue case
 *                     `tableColumns` (STA-1981).
 */
import { Badge, CopyButton, DateLabel, Link, StatusBadge } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { valueAt } from "#core/functions/value-at.function";
import type { ColumnNode } from "#core/types/column-node.type";
import { ResourceValue } from "#react/resource-pages/resource-value";

/**
 * One cell of `row` under `node` (absent for a column without a recording).
 *
 * @example
 * <ResourceCell resourceKey="orders.order" columnId="status" node={{ kind: "value", key: "status", cell: "status" }} row={row} />
 */
export function ResourceCell({
  resourceKey,
  columnId,
  node,
  row,
}: {
  readonly resourceKey: string;
  readonly columnId: string;
  readonly node: ColumnNode | undefined;
  readonly row: object;
}): ReactElement {
  const value = valueAt(row, columnId);
  const cell = node?.cell ?? (node?.copyable === true ? "copy" : "text");
  const kind = cell === "money" || cell === "principal" ? cell : (node?.kind ?? "value");
  const currency =
    node?.currency === undefined ? undefined : valueAt(row, node.currency.replace(/^record\./, ""));
  const text = (
    <ResourceValue
      resourceKey={resourceKey}
      path={columnId}
      kind={kind}
      value={value}
      currency={currency}
      labels={node?.labels}
    />
  );
  const tone = typeof value === "string" ? node?.tones?.[value] : undefined;
  if (cell === "badge") return <Badge tone={tone}>{text}</Badge>;
  if (cell === "status") return <StatusBadge tone={tone}>{text}</StatusBadge>;
  if (cell === "date" && (value instanceof Date || typeof value === "string"))
    return <DateLabel date={value} />;
  if (cell === "link" && typeof value === "string" && value !== "")
    return <Link href={value}>{text}</Link>;
  if (cell === "copy" && (typeof value === "string" || typeof value === "number"))
    return (
      <span className="inline-flex items-center gap-1">
        {text}
        <CopyButton value={String(value)} />
      </span>
    );
  return text;
}
