/**
 * Stackra file contract:
 * Purpose: `TransferListSide`, one list of the web TransferList: its title with a count, a "move all" button that
 *          moves every item the filter shows, a filter field and the house Listbox of the shown items with ticks.
 * Boundary: the filter matches the label and description, ignoring case, in the page's locale; a ticked item the
 *           filter hides stays ticked. The list is a labelled region named by its title.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D).
 */
import { useId, useState, type ReactElement } from "react";
import { useLocale } from "react-aria-components";

import type { SelectItem } from "#contracts/types/select-item.type";
import { Button } from "#react/button/button";
import { useNumberFormat } from "#react/hooks/use-number-format";
import { Listbox } from "#react/listbox/listbox";
import { SearchField } from "#react/search-field/search-field";

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
  const id = useId();
  const { locale } = useLocale();
  const format = useNumberFormat();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase(locale);
  const shown = items.filter((item) =>
    `${item.label} ${item.description ?? ""}`.toLocaleLowerCase(locale).includes(needle),
  );
  const movable = shown.filter((item) => !item.isDisabled).map((item) => item.id);
  return (
    <section aria-labelledby={`${id}-title`} className="flex min-w-0 flex-col gap-2">
      <div className="flex min-h-8 items-center justify-between gap-2">
        <h3 id={`${id}-title`} className="text-sm font-semibold">
          {title} <span className="font-normal text-muted">{format(items.length)}</span>
        </h3>
        <Button
          size="sm"
          variant="ghost"
          isDisabled={isDisabled || movable.length === 0}
          onPress={() => onMoveAll(movable)}
        >
          {moveAllLabel}
        </Button>
      </div>
      <SearchField
        aria-label={filterLabel}
        placeholder={filterLabel}
        value={query}
        onChange={setQuery}
        isFullWidth
        isDisabled={isDisabled}
      />
      {shown.length === 0 ? (
        <p
          style={{ borderRadius: "var(--radius-container)" }}
          className="border border-dashed border-separator p-4 text-center text-sm text-muted"
        >
          {emptyLabel}
        </p>
      ) : (
        <Listbox
          ariaLabel={title}
          items={shown}
          selectionMode="multiple"
          value={ticked}
          onChange={onTick}
          isDisabled={isDisabled}
          className="[&_[role=listbox]]:h-64"
        />
      )}
    </section>
  );
}
