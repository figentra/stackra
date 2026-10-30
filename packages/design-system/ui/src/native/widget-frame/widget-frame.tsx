/**
 * Stackra file contract:
 * Purpose: the native `WidgetFrame`: the card a dashboard widget or chart draws in. Its header carries the
 *          description, "Updated 2 min ago", a refresh button (a spinner while it works), a sort menu, the caller's
 *          actions and an overflow menu (view as table, full screen); a controls row holds a range picker and the
 *          compare switch; the body is the content, a table of its data, a skeleton, an EmptyState or an ErrorState
 *          with retry; then a footer.
 * Boundary: presents only (ADR 0307 decision 16). The web-only menu entries (CSV, PNG, copy link) are left out on
 *           native: a phone shares a screenshot, and a widget has no URL of its own there.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0307 (decisions 14 to 18); STA-1371.
 */
import { type ReactElement, type ReactNode, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";

import type { ChartSort } from "#contracts/enums/chart-sort.enum";
import type { WidgetData } from "#contracts/types/widget-data.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { formatChartCategory } from "#core/functions/format-chart-category.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { updatedAgoOf } from "#core/functions/updated-ago-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { ActionMenu } from "#native/action-menu/action-menu";
import { Card } from "#native/card/card";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { EmptyState } from "#native/empty-state/empty-state";
import { ErrorState } from "#native/error-state/error-state";
import { IconButton } from "#native/icon-button/icon-button";
import { Menu } from "#native/menu/menu";
import { Modal } from "#native/modal/modal";
import { Skeleton } from "#native/skeleton/skeleton";
import { Spinner } from "#native/spinner/spinner";
import { Switch } from "#native/switch/switch";
import { Text } from "#native/text/text";
import type { WidgetFrameProps } from "#native/widget-frame/widget-frame.props";
import { WIDGET_MENU_ICON } from "#core/constants/widget-menu-icon.constant";

/** The words' keys. */
const K = UI_KEYS.ui.widget_frame;

/** The orders the sort menu offers, in order. */
const SORTS: readonly ChartSort[] = ["value-desc", "value-asc", "label"];

/** The skeleton's column heights, a quiet chart shape. */
const BARS = [40, 64, 48, 80, 56, 96, 64] as const;

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
  updatedAt,
  onRefresh,
  controls,
  menu,
  data,
  sort,
  onSortChange,
  isComparing = false,
  onCompareChange,
  className,
}: WidgetFrameProps): ReactElement {
  const t = useUiText();
  const { locale } = useChartLocale();
  const [isTable, setTable] = useState(false);
  const [isFull, setFull] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (updatedAt === undefined) return;
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [updatedAt]);
  const entries = (menu ?? []).filter((action) => action === "table" || action === "fullscreen");

  const content: ReactNode =
    state === "loading" ? (
      <View accessibilityLabel={t(K.loading)} className="h-32 flex-row items-end gap-2">
        {BARS.map((height, index) => (
          // oxlint-disable-next-line react/no-array-index-key -- loading placeholders with repeating heights; nothing reorders them
          <Skeleton key={index} className="flex-1" style={{ height }} />
        ))}
      </View>
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
      <DataTable data={data} locale={locale} />
    ) : (
      children
    );

  return (
    <Card className={["gap-3", className].filter(Boolean).join(" ")}>
      <View className="flex-row flex-wrap items-start gap-x-3 gap-y-1">
        <View className="min-w-40 flex-1 gap-0.5">
          <Text accessibilityRole="header" className="text-sm font-semibold" numberOfLines={1}>
            {title}
          </Text>
          {description ? (
            <Text type="small" tone="muted">
              {description}
            </Text>
          ) : null}
        </View>
        <View className="ms-auto flex-row items-center gap-1">
          {updatedAt !== undefined ? (
            <Text type="caption" tone="muted">
              {t(K.updated, { time: updatedAgoOf(updatedAt, now, locale) })}
            </Text>
          ) : null}
          {isRefreshing ? (
            <Spinner size="sm" label={t(K.refreshing)} />
          ) : onRefresh ? (
            <IconButton
              size="sm"
              variant="ghost"
              icon="refresh-cw"
              label={t(K.refresh)}
              onPress={onRefresh}
            />
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
          {entries.length > 0 ? (
            <ActionMenu
              size="sm"
              label={t(K.more)}
              sections={[
                {
                  id: "widget",
                  title: t(K.more),
                  isTitleHidden: true,
                  items: entries.map((action) =>
                    action === "table"
                      ? {
                          id: action,
                          label: isTable ? t(K.chart) : t(K.table),
                          icon: isTable ? WIDGET_MENU_ICON.chart : WIDGET_MENU_ICON.table,
                          isDisabled: !data,
                          onPress: () => setTable((shown) => !shown),
                        }
                      : {
                          id: action,
                          label: t(K.fullscreen),
                          icon: WIDGET_MENU_ICON.fullscreen,
                          onPress: () => setFull(true),
                        },
                  ),
                },
              ]}
            />
          ) : null}
        </View>
      </View>
      {controls || onCompareChange ? (
        <View className="flex-row flex-wrap items-center justify-between gap-3">
          {controls}
          {onCompareChange ? (
            <Switch label={t(K.compare)} value={isComparing} onChange={onCompareChange} />
          ) : null}
        </View>
      ) : null}
      <View className="min-h-24" accessibilityState={{ busy: state === "loading" || isRefreshing }}>
        {content}
      </View>
      {footer ? <View className="flex-row items-center">{footer}</View> : null}
      {entries.includes("fullscreen") ? (
        <Modal isOpen={isFull} onOpenChange={setFull} size="full" label={title}>
          <Modal.Header>
            <Modal.Title>{title}</Modal.Title>
            <Modal.Close label={t(K.close)} />
          </Modal.Header>
          <Modal.Body>{content}</Modal.Body>
        </Modal>
      ) : null}
    </Card>
  );
}

/** The widget's data as rows of text, numbers written in the locale. */
function DataTable({
  data,
  locale,
}: {
  readonly data: WidgetData;
  readonly locale: string;
}): ReactElement {
  const cell = (value: string | number | null | undefined, column: number) =>
    column === 0
      ? formatChartCategory(value, locale, data.categoryFormat)
      : typeof value === "number"
        ? formatChartNumber(value, locale, data.valueFormat)
        : (value ?? "");
  return (
    <ScrollView horizontal>
      <View className="min-w-full">
        <View className="flex-row border-b border-separator py-1.5">
          {data.head.map((head, index) => (
            <Text
              key={head}
              type="caption"
              tone="muted"
              className={index === 0 ? "w-28 text-start" : "w-24 text-end"}
            >
              {head}
            </Text>
          ))}
        </View>
        {data.rows.map((row) => (
          <View key={String(row[0])} className="flex-row border-b border-separator/60 py-1.5">
            {row.map((value, column) => (
              <Text
                // oxlint-disable-next-line react/no-array-index-key -- a table row's cells are fixed columns that never reorder
                key={column}
                type="small"
                className={column === 0 ? "w-28 text-start" : "w-24 text-end tabular-nums"}
              >
                {cell(value, column)}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
