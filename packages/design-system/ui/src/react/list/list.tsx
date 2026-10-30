/**
 * Stackra file contract:
 * Purpose: the web `List`: draws `items` as `ListItem` rows on a surface. A list that does not select is a plain
 *          `ul` of `li` rows (a pressable row is a button), so no widget role is claimed; a list that selects is HeroUI's
 *          `ListBox` with one `ListBox.Item` per row, which brings the option roles, arrow keys, type-ahead and the
 *          selected checkmark. The selection is reported as a list of ids in the items' order. An empty list shows
 *          `emptyState`, a loading one a named spinner, and a list with `hasMore` calls `onLoadMore` when its end is
 *          scrolled into view. The rows fade in and rise into place as one block when the list mounts (`Reveal`, unless `isAnimated` is
 *          off); the Reveal sits inside the surface, so a glass surface never has an animated ancestor (ADR 0329).
 * Boundary: no styling layer of its own beyond the divider and corner utilities of the surface; the look is HeroUI's,
 *           themed by `@stackra/tokens`. It never sorts, filters or fetches. While the list selects, a row's `onPress`
 *           is not called: a row selects or acts, never both. Not built here, and not in the contract: sections,
 *           virtualisation and pull to refresh (native keeps its own scrolling list).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313 (decisions 1, 2, 4 and 5); ADR 0165
 *          (HeroUI v3 on web); WCAG 2.2 SC 4.1.2 and 4.1.3.
 */
import type { ReactElement } from "react";
import { ListBox } from "@heroui/react";

import type { ListItemData } from "#contracts/types/list-item-data.type";
import { keysOfSelection } from "#core/functions/keys-of-selection.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { ListItem } from "#react/list/list-item";
import { ListItemContent } from "#react/list/list-item-content";
import { textValueOf } from "#react/list/text-value-of.function";
import { useEndReached } from "#react/list/use-end-reached";
import { Reveal } from "#react/reveal/reveal";
import { Spinner } from "#react/spinner/spinner";
import { Surface } from "#react/surface/surface";
import type { ListProps } from "#react/list/list.props";

/**
 * A list of rows. Name it with `label`. Give it `selectionMode` to make it a list box whose rows are selected by
 * press, Space and Enter; without one it is a plain list. `emptyState` shows only when nothing is loading and there
 * are no items, and `loadingLabel` is spoken once for the spinner, not for every row.
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
  style,
  ...rest
}: ListProps<TItem>): ReactElement {
  const ids = items.map((item) => item.id);
  const onReach = hasMore === true && !isLoading ? onLoadMore : undefined;
  const marker = useEndReached(onReach, items.length);
  return (
    // A list fills its parent and keeps a floor, so a shrink-to-fit parent (a centred frame) never squeezes it to its
    // content; the floor is capped at its grid cell, so two lists side by side never overlap. Inline, so it holds
    // wherever the app's Tailwind does not scan this package.
    <div
      {...rest}
      aria-busy={isLoading}
      style={{ inlineSize: "100%", minInlineSize: "min(24rem, 100%)", ...style }}
    >
      {items.length === 0 ? (
        isLoading ? null : (
          emptyState
        )
      ) : (
        <Surface
          {...omitUndefined({ variant })}
          className="overflow-hidden rounded-[var(--radius-container)]"
        >
          <Reveal isAnimated={isAnimated}>
            {selectionMode === "none" ? (
              <ul aria-label={label} className="divide-y divide-separator">
                {items.map((item) => (
                  // Named props, not a spread: an app's own item type may carry data that is not a `li` attribute.
                  <ListItem
                    key={item.id}
                    title={item.title}
                    description={item.description}
                    startIcon={item.startIcon}
                    endContent={item.endContent}
                    hasChevron={item.hasChevron}
                    onPress={item.onPress}
                    isDisabled={item.isDisabled}
                    label={item.label}
                  />
                ))}
              </ul>
            ) : (
              <ListBox
                aria-label={label}
                selectionMode={selectionMode}
                {...omitUndefined({
                  selectedKeys,
                  defaultSelectedKeys,
                })}
                onSelectionChange={(selection) =>
                  onSelectionChange?.(keysOfSelection(selection, ids))
                }
              >
                {items.map((item) => (
                  <ListBox.Item
                    key={item.id}
                    id={item.id}
                    textValue={textValueOf(item)}
                    {...omitUndefined({ isDisabled: item.isDisabled })}
                    {...(item.label === undefined ? {} : { "aria-label": item.label })}
                  >
                    <ListItemContent
                      title={item.title}
                      description={item.description}
                      startIcon={item.startIcon}
                      endContent={item.endContent}
                      hasChevron={item.hasChevron}
                    />
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            )}
          </Reveal>
        </Surface>
      )}
      {isLoading ? (
        <div className="flex justify-center p-4">
          <Spinner {...omitUndefined({ label: loadingLabel })} />
        </div>
      ) : null}
      {onReach ? <div ref={marker} aria-hidden="true" /> : null}
    </div>
  );
}
