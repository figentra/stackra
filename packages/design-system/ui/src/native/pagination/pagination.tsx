/**
 * Stackra file contract:
 * Purpose: the native `Pagination`: a "1–10 of 240" summary, previous, numbered pages with gaps and next, and
 *          optionally a page-size Select and a "Go to page" number input.
 * Boundary: a toolbar named by `label`; each page is a 44-point button named "Page 3", the current one selected. The
 *           state is the web Pagination's (`usePaginationState`); numbers follow the customer's digits and the
 *           chevrons mirror in right-to-left.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 2.5.8 and 4.1.2; STA-1371.
 */
import { useState, type ReactElement } from "react";
import { Pressable, View } from "react-native";

import { DISPLAY_KEYS } from "#core/constants/display-keys.constant";
import { pageItemsOf } from "#core/functions/page-items-of.function";
import { usePaginationState } from "#react/hooks/use-pagination-state";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import { useNumberFormat } from "#native/hooks/use-number-format";
import { IconButton } from "#native/icon-button/icon-button";
import { NumberField } from "#native/number-field/number-field";
import type { PaginationProps } from "#native/pagination/pagination.props";
import { Select } from "#native/select/select";
import { Text } from "#native/text/text";

/** The pagination's keys. */
const K = DISPLAY_KEYS.ui.pagination;

/** Numbered pages over a known total. */
export function Pagination(props: PaginationProps): ReactElement {
  const {
    total,
    pageSizes,
    hasJump = false,
    hasSummary = true,
    siblings = 1,
    label,
    className,
  } = props;
  const t = useUiText();
  const format = useNumberFormat();
  const { current, size, pageCount, from, to, go, resize } = usePaginationState(props);
  const [jump, setJump] = useState<number | null>(null);
  return (
    <View className={`gap-3 ${className ?? ""}`}>
      {hasSummary ? (
        <Text type="small" tone="muted">
          {t(K.summary, { from: format(from), to: format(to), total: format(total) })}
        </Text>
      ) : null}
      <View
        accessibilityRole="toolbar"
        accessibilityLabel={label ?? t(K.label)}
        className="flex-row flex-wrap items-center gap-1"
      >
        <IconButton
          icon="chevron-left"
          label={t(K.previous)}
          variant="tertiary"
          isDisabled={current <= 1}
          onPress={() => go(current - 1)}
        />
        {pageItemsOf(current, pageCount, siblings).map((item, index) =>
          item === "ellipsis" ? (
            <Text
              // oxlint-disable-next-line react/no-array-index-key -- two ellipses are told apart only by place; the prefix keeps an ellipsis at index 5 off page 5's key
              key={`ellipsis-${index}`}
              tone="muted"
              importantForAccessibility="no"
              className="px-1"
            >
              …
            </Text>
          ) : (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={t(K.page, { page: format(item) })}
              accessibilityState={{ selected: item === current }}
              onPress={() => go(item)}
              className={`min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] px-2 ${item === current ? "bg-accent-soft" : ""}`}
            >
              <Text className={item === current ? "font-semibold text-accent-soft-foreground" : ""}>
                {format(item)}
              </Text>
            </Pressable>
          ),
        )}
        <IconButton
          icon="chevron-right"
          label={t(K.next)}
          variant="tertiary"
          isDisabled={current >= pageCount}
          onPress={() => go(current + 1)}
        />
      </View>
      {pageSizes?.length || hasJump ? (
        <View className="flex-row flex-wrap items-end gap-3">
          {pageSizes?.length ? (
            <Select
              label={t(K.per_page)}
              isFullWidth={false}
              items={pageSizes.map((option) => ({ id: String(option), label: format(option) }))}
              value={String(size)}
              onChange={(key) => {
                if (key) resize(Number(key));
              }}
            />
          ) : null}
          {hasJump ? (
            <View className="flex-row items-end gap-2">
              <NumberField
                label={t(K.jump)}
                value={jump}
                onChange={setJump}
                minValue={1}
                maxValue={pageCount}
                hasSteppers={false}
                isFullWidth={false}
                className="w-24"
              />
              <Button
                variant="secondary"
                isDisabled={jump === null}
                onPress={() => {
                  if (jump !== null) go(jump);
                  setJump(null);
                }}
              >
                {t(K.go)}
              </Button>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
