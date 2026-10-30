/**
 * Stackra file contract:
 * Purpose: `TransferListSide`, one list of the native TransferList: its title with a count, a "move all" button for
 *          what the filter shows, a filter field and the house Listbox of the shown items with ticks.
 * Boundary: the filter matches the label and description, ignoring case, in the screen's locale; a ticked item the
 *           filter hides stays ticked.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D).
 */
import { useState, type ReactElement } from "react";
import { View } from "react-native";

import type { SelectItem } from "#contracts/types/select-item.type";
import { Button } from "#native/button/button";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { useNumberFormat } from "#native/hooks/use-number-format";
import { Listbox } from "#native/listbox/listbox";
import { SearchField } from "#native/search-field/search-field";
import { Text } from "#native/text/text";

/** One side of a transfer list. */
export function TransferListSide({
  title,
  items,
  ticked,
  onTick,
  onMoveAll,
  moveAllLabel,
  filterLabel,
  emptyLabel,
  isDisabled,
}: {
  readonly title: string;
  readonly items: readonly SelectItem[];
  readonly ticked: readonly string[];
  readonly onTick: (keys: readonly string[]) => void;
  readonly onMoveAll: (keys: readonly string[]) => void;
  readonly moveAllLabel: string;
  readonly filterLabel: string;
  readonly emptyLabel: string;
  readonly isDisabled: boolean;
}): ReactElement {
  const { locale } = useDesignSystem();
  const format = useNumberFormat();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase(locale);
  const shown = items.filter((item) =>
    `${item.label} ${item.description ?? ""}`.toLocaleLowerCase(locale).includes(needle),
  );
  const movable = shown.filter((item) => !item.isDisabled).map((item) => item.id);
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between gap-2">
        <Text accessibilityRole="header" className="font-semibold">
          {`${title} ${format(items.length)}`}
        </Text>
        <Button
          size="sm"
          variant="ghost"
          isDisabled={isDisabled || movable.length === 0}
          onPress={() => onMoveAll(movable)}
        >
          {moveAllLabel}
        </Button>
      </View>
      <SearchField
        accessibilityLabel={filterLabel}
        placeholder={filterLabel}
        value={query}
        onChange={setQuery}
        isDisabled={isDisabled}
      />
      {shown.length === 0 ? (
        <Text tone="muted" className="p-3 text-center">
          {emptyLabel}
        </Text>
      ) : (
        <Listbox
          ariaLabel={title}
          items={shown}
          selectionMode="multiple"
          value={ticked}
          onChange={onTick}
          isDisabled={isDisabled}
        />
      )}
    </View>
  );
}
