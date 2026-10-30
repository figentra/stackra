/**
 * Stackra file contract:
 * Purpose: the web `WidgetFrame`: the card a dashboard widget or chart draws in, a region named by its title. Its
 *          header carries the description, "Updated 2 min ago", a refresh button that spins while it works, a sort
 *          menu, the caller's actions and an overflow menu (download CSV or PNG, view as table, full screen, copy
 *          link); a controls row holds a range picker and the compare switch; the body is the content, a table of its
 *          data, a skeleton, an EmptyState or an ErrorState with retry; then a footer; and it spans its share of a
 *          12-column grid.
 * Boundary: presents only (ADR 0307 decision 16): the caller owns the data, the sort, the comparison and the refresh.
 *           The PNG is the first SVG in the body. The span classes take effect inside a `grid-cols-12` parent.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0307 (decisions 14 to 18); WCAG 2.2 SC 1.1.1, 1.3.1, 2.3.3 and 4.1.3;
 *          STA-1371.
 */
import { cn } from "@heroui/react";
import { useReducedMotion } from "motion/react";
import { type ReactElement, useEffect, useId, useRef, useState } from "react";
import { useLocale } from "react-aria-components";

import type { ChartSort } from "#contracts/enums/chart-sort.enum";
import type { WidgetMenuAction } from "#contracts/enums/widget-menu-action.enum";
import type { WidgetSize } from "#contracts/enums/widget-size.enum";
import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { chartCsvOf } from "#core/functions/chart-csv-of.function";
import { formatChartCategory } from "#core/functions/format-chart-category.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { updatedAgoOf } from "#core/functions/updated-ago-of.function";
import { ActionMenu } from "#react/action-menu/action-menu";
import { Card } from "#react/card/card";
import { EmptyState } from "#react/empty-state/empty-state";
import { ErrorState } from "#react/error-state/error-state";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { IconButton } from "#react/icon-button/icon-button";
import { Menu } from "#react/menu/menu";
import { Modal } from "#react/modal/modal";
import { Skeleton } from "#react/skeleton/skeleton";
import { Spinner } from "#react/spinner/spinner";
import { Switch } from "#react/switch/switch";
import { Text } from "#react/text/text";
import { downloadFile } from "#react/widget-frame/download-file.function";
import { svgPngOf } from "#react/widget-frame/svg-png-of.function";
import type { WidgetFrameProps } from "#react/widget-frame/widget-frame.props";
import { WIDGET_MENU_ICON } from "#core/constants/widget-menu-icon.constant";

/** The grid span of each size: full width on a phone, its share of 12 columns from `md`. */
const SPAN: Readonly<Record<WidgetSize, string>> = {
  small: "col-span-12 md:col-span-3",
  medium: "col-span-12 md:col-span-6",
  large: "col-span-12 md:col-span-9",
  full: "col-span-12",
};

/** The orders the sort menu offers, in order. */
const SORTS: readonly ChartSort[] = ["value-desc", "value-asc", "label"];

/** The words' keys. */
const K = UI_KEYS.ui.widget_frame;

/** The skeleton's column heights, a quiet chart shape. */
const BARS = ["h-10", "h-16", "h-12", "h-20", "h-14", "h-24", "h-16"] as const;

/** A dashboard widget's card. */
export function WidgetFrame({
  title,
  description,
  actions,
  children,
  footer,
  state = "ready",
  emptyText,
  errorText,
  onRetry,
  isRefreshing = false,
  size = "medium",
  updatedAt,
  onRefresh,
  controls,
  menu,
  data,
  fileName,
  sort,
  onSortChange,
  isComparing = false,
  onCompareChange,
  className,
}: WidgetFrameProps): ReactElement {
  const t = useUiText();
  const { locale } = useLocale();
  const isReduced = useReducedMotion() === true;
  const titleId = useId();
  const anchor = `widget-${titleId.replaceAll(/[^\w-]/g, "")}`;
  const root = useRef<HTMLElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [isTable, setTable] = useState(false);
  const [isFull, setFull] = useState(false);
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (updatedAt === undefined) return;
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [updatedAt]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2000);
    return () => clearTimeout(timer);
  }, [notice]);

  const name = fileName ?? title;
  const run: Record<WidgetMenuAction, () => void> = {
    csv: () => {
      if (data)
        downloadFile(
          new Blob([`\uFEFF${chartCsvOf(data)}`], { type: "text/csv;charset=utf-8" }),
          `${name}.csv`,
        );
    },
    png: () => {
      const svg = body.current?.querySelector("svg.recharts-surface, svg[data-chart]");
      const card = root.current?.firstElementChild;
      if (!(svg instanceof SVGSVGElement) || !card) return;
      const background = getComputedStyle(card).backgroundColor;
      void svgPngOf(svg, background).then((blob) => {
        if (blob) downloadFile(blob, `${name}.png`);
      });
    },
    table: () => setTable((shown) => !shown),
    fullscreen: () => setFull(true),
    link: () => {
      const url = `${location.origin}${location.pathname}${location.search}#${anchor}`;
      void navigator.clipboard?.writeText(url).then(() => setNotice(t(K.link_copied)));
    },
  };
  const menuItem: Record<WidgetMenuAction, Omit<MenuLeafItem, "id">> = {
    csv: { label: t(K.csv), icon: WIDGET_MENU_ICON.csv, isDisabled: !data },
    png: { label: t(K.png), icon: WIDGET_MENU_ICON.png },
    table: {
      label: isTable ? t(K.chart) : t(K.table),
      icon: isTable ? WIDGET_MENU_ICON.chart : WIDGET_MENU_ICON.table,
      isDisabled: !data,
    },
    fullscreen: { label: t(K.fullscreen), icon: WIDGET_MENU_ICON.fullscreen },
    link: { label: t(K.link), icon: WIDGET_MENU_ICON.link },
  };

  const content =
    state === "loading" ? (
      <div role="status" aria-label={t(K.loading)} className="flex h-32 items-end gap-2">
        {BARS.map((height, index) => (
          // oxlint-disable-next-line react/no-array-index-key -- fixed placeholder bars; heights repeat and the list never changes
          <Skeleton key={index} className={`flex-1 ${height}`} />
        ))}
      </div>
    ) : state === "empty" ? (
      <EmptyState title={emptyText ?? t(K.empty)} headingLevel={4} className="py-6" />
    ) : state === "error" ? (
      <ErrorState
        title={errorText ?? t(K.error)}
        headingLevel={4}
        className="py-6"
        {...(onRetry ? { retry: { label: t(K.retry), onPress: onRetry } } : {})}
      />
    ) : isTable && data ? (
      <DataTable data={data} label={title} locale={locale} />
    ) : (
      children
    );

  return (
    <section
      ref={root}
      id={anchor}
      aria-labelledby={titleId}
      aria-busy={state === "loading" || isRefreshing}
      className={cn(SPAN[size], className)}
    >
      <Card className="h-full">
        <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
          <div className="flex min-w-40 flex-1 flex-col gap-0.5">
            <h3 id={titleId} className="m-0 truncate text-sm font-semibold">
              {title}
            </h3>
            {description ? (
              <Text type="small" tone="muted">
                {description}
              </Text>
            ) : null}
          </div>
          <div className="ms-auto flex shrink-0 items-center gap-1">
            {updatedAt !== undefined ? (
              <Text type="small" tone="muted" className="whitespace-nowrap">
                <time dateTime={new Date(updatedAt).toISOString()}>
                  {t(K.updated, { time: updatedAgoOf(updatedAt, now, locale) })}
                </time>
              </Text>
            ) : null}
            {onRefresh ? (
              <IconButton
                size="sm"
                variant="ghost"
                label={isRefreshing ? t(K.refreshing) : t(K.refresh)}
                onPress={onRefresh}
                icon={
                  <Icon
                    name="refresh-cw"
                    className={isRefreshing && !isReduced ? "animate-spin" : undefined}
                  />
                }
              />
            ) : isRefreshing ? (
              <Spinner size="sm" label={t(K.refreshing)} />
            ) : null}
            {onSortChange ? (
              <Menu
                selectionMode="single"
                align="end"
                value={sort ? [sort] : []}
                onChange={(picked) => {
                  const next = SORTS.find((item) => item !== sort && picked.includes(item));
                  if (next) onSortChange(next);
                }}
                sections={[
                  {
                    id: "sort",
                    title: t(K.sort),
                    isTitleHidden: true,
                    items: SORTS.map((item) => ({
                      id: item,
                      label: t(K[`sort_${item.replace("-", "_")}` as "sort_label"]),
                    })),
                  },
                ]}
              >
                <IconButton size="sm" variant="ghost" icon="arrow-up-down" label={t(K.sort)} />
              </Menu>
            ) : null}
            {actions}
            {menu && menu.length > 0 ? (
              <ActionMenu
                size="sm"
                label={t(K.more)}
                sections={[
                  {
                    id: "widget",
                    title: t(K.more),
                    isTitleHidden: true,
                    items: menu.map((action) => ({
                      id: action,
                      ...menuItem[action],
                      onPress: run[action],
                    })),
                  },
                ]}
              />
            ) : null}
          </div>
        </div>
        {controls || onCompareChange ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            {controls}
            {onCompareChange ? (
              <Switch
                size="sm"
                label={t(K.compare)}
                value={isComparing}
                onChange={onCompareChange}
              />
            ) : null}
          </div>
        ) : null}
        <Card.Content ref={body} className="min-h-24">
          {content}
        </Card.Content>
        {footer ? <Card.Footer className="text-sm">{footer}</Card.Footer> : null}
        <span
          role="status"
          aria-live="polite"
          className={notice ? "text-xs text-muted" : "sr-only"}
        >
          {notice}
        </span>
      </Card>
      {menu?.includes("fullscreen") ? (
        <Modal isOpen={isFull} onOpenChange={setFull} size="full" label={title}>
          <Modal.Header>
            <Modal.Title>{title}</Modal.Title>
            <Modal.Close label={t(K.close)} />
          </Modal.Header>
          {/* A chart states its own height; full screen lets its plot take most of the viewport instead. */}
          <Modal.Body className="[&_.recharts-wrapper]:!h-[65vh]">{content}</Modal.Body>
        </Modal>
      ) : null}
    </section>
  );
}

/** The widget's data as a visible table, numbers written in the locale. */
function DataTable({
  data,
  label,
  locale,
}: {
  readonly data: NonNullable<WidgetFrameProps["data"]>;
  readonly label: string;
  readonly locale: string;
}): ReactElement {
  const cell = (value: string | number | null | undefined, column: number) =>
    column === 0
      ? formatChartCategory(value, locale, data.categoryFormat)
      : typeof value === "number"
        ? formatChartNumber(value, locale, data.valueFormat)
        : (value ?? "");
  return (
    <div className="max-h-80 overflow-auto">
      <table data-slot="widget-table" className="w-full border-collapse text-sm">
        <caption className="sr-only">{label}</caption>
        <thead>
          <tr>
            {data.head.map((head, index) => (
              <th
                key={head}
                scope="col"
                className={cn(
                  "border-b border-separator px-2 py-1.5 text-xs font-medium text-muted",
                  index === 0 ? "text-start" : "text-end",
                )}
              >
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={String(row[0])} className="border-b border-separator/60 last:border-0">
              {row.map((value, column) =>
                column === 0 ? (
                  <th
                    key={data.head[column]}
                    scope="row"
                    className="px-2 py-1.5 text-start font-normal"
                  >
                    {cell(value, column)}
                  </th>
                ) : (
                  <td key={data.head[column]} className="px-2 py-1.5 text-end tabular-nums">
                    {cell(value, column)}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
