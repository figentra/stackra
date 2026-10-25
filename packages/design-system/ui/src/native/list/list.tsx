/**
 * Stackra file contract:
 * Purpose: the native `List`: draws `items` as `ListItem` rows in a React Native `FlatList` inside HeroUI Native's
 *          `ListGroup` surface, with a separator between rows. A list that selects makes each row a radio (one) or a
 *          checkbox (several) with its checked state and a checkmark, and reports the selection as a list of ids in the
 *          items' order. An empty list shows `emptyState`, a loading one a named spinner, and a list with `hasMore`
 *          calls `onLoadMore` from the `FlatList`'s end-reached callback, which is the contract's `onLoadMore`. The rows
 *          fade in and rise into place as one block when the list mounts (`Reveal`, unless `isAnimated` is off), inside the `ListGroup`,
 *          so a glass group never has an animated ancestor (ADR 0329).
 * Boundary: no styling of its own; the look is HeroUI Native's. It never sorts, filters or fetches. While the list
 *           selects, a row's `onPress` is not called: a row selects or acts, never both. Not built here, and not in the
 *           contract: sections and pull to refresh. The selection is uncontrolled unless `selectedKeys` is given.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313 (decisions 1, 2, 4, 5 and 7); ADR 0165
 *          (HeroUI Native on native); WCAG 2.2 SC 4.1.2 and 4.1.3.
 */
import { ListGroup } from "heroui-native";
import { useState } from "react";
import { FlatList, View, type ViewProps } from "react-native";

import type { ListContractProps } from "#contracts/types/list-contract-props.type";
import type { ListItemData } from "#contracts/types/list-item-contract-props.type";
import { keysOfSelection } from "#core/functions/keys-of-selection.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Icon } from "#native/icon/icon";
import { endContentNode, ListItem } from "#native/list/list-item";
import { Reveal } from "#native/reveal/reveal";
import { Separator } from "#native/separator/separator";
import { Spinner } from "#native/spinner/spinner";

/** Props of the native List: the shared contract plus the props of its root `View`, passed through unchanged. */
export type ListProps<TItem extends ListItemData = ListItemData> = ListContractProps<TItem> &
  Omit<ViewProps, keyof ListContractProps | "children" | "accessibilityLabel">;

/** A rule between two rows, inset by the row's padding so it does not touch the surface's edge. */
function RowSeparator() {
  return <Separator className="mx-4" />;
}

/**
 * A list of rows. Name it with `label`. Give it `selectionMode` to select rows by press, reported through
 * `onSelectionChange`. `emptyState` shows only when nothing is loading and there are no items, and `loadingLabel` is
 * spoken once for the spinner, not for every row.
 */
export function List<TItem extends ListItemData = ListItemData>({
  items,
  emptyState,
  isLoading = false,
  loadingLabel,
  label,
  variant,
  selectionMode = "none",
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  hasMore,
  onLoadMore,
  isAnimated = true,
  ...rest
}: ListProps<TItem>) {
  const [ownKeys, setOwnKeys] = useState<readonly string[]>(defaultSelectedKeys ?? []);
  const selected = selectedKeys ?? ownKeys;
  const ids = items.map((item) => item.id);
  const isSelecting = selectionMode !== "none";

  /** One press on a row: one mode replaces the selection (or clears it), several mode toggles the row. */
  const toggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((key) => key !== id)
      : selectionMode === "single"
        ? [id]
        : [...selected, id];
    const ordered = keysOfSelection(new Set(next), ids);
    setOwnKeys(ordered);
    onSelectionChange?.(ordered);
  };

  return (
    <View {...rest} accessibilityState={{ busy: isLoading }}>
      {items.length === 0 ? (
        isLoading ? null : (
          emptyState
        )
      ) : (
        <ListGroup {...omitUndefined({ variant })}>
          <Reveal isAnimated={isAnimated}>
            <FlatList
              data={items}
              extraData={selected}
              keyExtractor={(item) => item.id}
              accessibilityRole="list"
              accessibilityLabel={label}
              ItemSeparatorComponent={RowSeparator}
              onEndReachedThreshold={0.5}
              {...(hasMore === true && !isLoading && onLoadMore
                ? { onEndReached: onLoadMore }
                : {})}
              renderItem={({ item }) => {
                const isChecked = selected.includes(item.id);
                return (
                  <ListItem
                    title={item.title}
                    description={item.description}
                    startIcon={item.startIcon}
                    endContent={
                      isSelecting && isChecked ? (
                        <>
                          {endContentNode(item.endContent)}
                          <Icon name="check" tone="accent" />
                        </>
                      ) : (
                        item.endContent
                      )
                    }
                    hasChevron={item.hasChevron}
                    onPress={isSelecting ? () => toggle(item.id) : item.onPress}
                    isDisabled={item.isDisabled}
                    label={item.label}
                    {...(isSelecting
                      ? ({
                          accessibilityRole: selectionMode === "single" ? "radio" : "checkbox",
                          accessibilityState: { checked: isChecked },
                        } as const)
                      : {})}
                  />
                );
              }}
            />
          </Reveal>
        </ListGroup>
      )}
      {isLoading ? (
        <View className="items-center p-4">
          <Spinner {...omitUndefined({ label: loadingLabel })} />
        </View>
      ) : null}
    </View>
  );
}
