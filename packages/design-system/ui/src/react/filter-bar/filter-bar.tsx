/**
 * Stackra file contract:
 * Purpose: the web `FilterBar`: the search and filter row of a resource index, on the shared contract. It draws a
 *          `SearchField` bound to `query.search`, an add-filter `Menu` that lists the filters not yet applied, one
 *          chip per applied filter, and a clear-all button shown only while the query narrows the records. A chip is a
 *          button that opens that filter's editor in a `Popover` and a close button that removes the filter; choosing
 *          a filter from the menu adds its chip with the editor already open. Every other `div` prop passes through to
 *          the root, which is a named `search` landmark.
 * Boundary: it holds no query: each change calls `onQueryChange` with the whole next query, and only the bar's own
 *           editing state (which chip's popover is open) lives here. The sort is handed through untouched and the page
 *           is the app's. A filter whose value filters nothing has no chip once its editor closes (ADR 0318 decision 3),
 *           and focus then goes to the add-filter button, because the chip it was on is gone; removing a chip and
 *           clear-all do the same. A polite status line tells assistive technology how many filters are applied. It
 *           builds on `Popover`, `Menu`, `SearchField`, `Button` and `CloseButton` of earlier waves and, through
 *           `FilterEditor`, on NumberField and DateField, leaf groups of this wave (ADR 0318 decision 4). The
 *           words come from the `ui` catalogue in the active locale.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318 (decisions 1 to 4); ADR 0165 (HeroUI v3 on
 *          web); owner decision 6 of STA-350 (thin wrappers); WCAG 2.2 SC 1.3.1, 2.1.1, 2.4.3, 2.5.8, 4.1.2, 4.1.3.
 */
import { useRef, useState, type ComponentPropsWithRef, type ReactElement } from "react";
import { useLocale } from "react-aria-components";

import type { FilterBarContractProps } from "#contracts/types/filter-bar-contract-props.type";
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import type { FilterValue } from "#contracts/types/filter-value.type";
import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import { clearResourceQueryFilters } from "#core/functions/clear-resource-query-filters.function";
import { filterChipTextOf } from "#core/functions/filter-chip-text-of.function";
import { isFilterValueEmpty } from "#core/functions/is-filter-value-empty.function";
import { isResourceQueryFiltered } from "#core/functions/is-resource-query-filtered.function";
import { queryWithFilter } from "#core/functions/query-with-filter.function";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#core/hooks/use-ui-text";
import { filterChipWordsOf } from "#core/functions/filter-chip-words-of.function";
import { Button } from "#react/button/button";
import { CloseButton } from "#react/close-button/close-button";
import { FilterEditor } from "#react/filter-bar/filter-editor";
import { Menu } from "#react/menu/menu";
import { Popover } from "#react/popover/popover";
import { SearchField } from "#react/search-field/search-field";

/**
 * Props of the web FilterBar: the shared contract plus the props of a `div`, passed through to the root. The bar draws
 * its own content, so children are refused.
 */
export type FilterBarProps = FilterBarContractProps &
  Omit<ComponentPropsWithRef<"div">, keyof FilterBarContractProps | "children">;

/** The props of one chip, which is one filter shown as a button that opens its editor and a button that removes it. */
interface FilterChipProps {
  /** The filter the chip stands for. */
  readonly definition: FilterDefinition;
  /** What the query holds for the filter, or `undefined` while its editor is open and still empty. */
  readonly value: FilterValue | undefined;
  /** The locale the value is written in. */
  readonly locale: string;
  /** Whether the editor's popover is open. */
  readonly isOpen: boolean;
  /** Called when the popover opens or closes. */
  readonly onOpenChange: (isOpen: boolean) => void;
  /** Called with each change of the filter's value. */
  readonly onChange: (value: FilterValue | undefined) => void;
  /** Called when the remove button is pressed. */
  readonly onRemove: () => void;
}

/** One filter as a chip: `Status: Paid`, opening its editor, with a button to remove it. */
function FilterChip({
  definition,
  value,
  locale,
  isOpen,
  onOpenChange,
  onChange,
  onRemove,
}: FilterChipProps): ReactElement {
  const t = useUiText();
  const summary = filterChipTextOf(definition, value, locale, filterChipWordsOf(t));
  return (
    <div role="group" aria-label={definition.label} className="inline-flex items-center gap-1">
      <Popover
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={definition.label}
        placement="bottom"
        align="start"
        trigger={
          <Button variant="secondary" size="sm" endIcon="chevron-down">
            {summary === "" ? definition.label : `${definition.label}: ${summary}`}
          </Button>
        }
      >
        <FilterEditor definition={definition} value={value} onChange={onChange} />
      </Popover>
      <CloseButton
        label={t(UI_KEYS.ui.filter_bar.remove, { label: definition.label })}
        onPress={onRemove}
      />
    </div>
  );
}

/**
 * The search and filters of a resource index. Controlled: pass the `query` and take the next one from `onQueryChange`.
 * Put it in the `filterBar` slot of a `DataTable` with the same query.
 */
export function FilterBar({
  query,
  onQueryChange,
  filters,
  searchLabel,
  searchPlaceholder,
  "aria-label": ariaLabel,
  ...rest
}: FilterBarProps): ReactElement {
  const t = useUiText();
  const { locale } = useLocale();
  const [editingId, setEditingId] = useState<string | null>(null);
  const addButton = useRef<HTMLButtonElement>(null);

  const definitionOf = (id: string) => filters.find((filter) => filter.id === id);
  const appliedIds = Object.entries(query.filterValues)
    .filter(([id, value]) => definitionOf(id) !== undefined && !isFilterValueEmpty(value))
    .map(([id]) => id);
  // The filter whose editor is open has a chip even while it filters nothing; it goes after the applied ones.
  const chipIds =
    editingId !== null && definitionOf(editingId) !== undefined && !appliedIds.includes(editingId)
      ? [...appliedIds, editingId]
      : appliedIds;
  const addable: readonly MenuLeafItem[] = filters
    .filter((filter) => !chipIds.includes(filter.id))
    .map((filter) => ({
      id: filter.id,
      label: filter.label,
      icon: filter.icon,
      isDisabled: filter.isDisabled,
    }));

  // The chip that had focus is about to go, so focus goes to the add button once the chips have been drawn again.
  const focusAddButton = () => requestAnimationFrame(() => addButton.current?.focus());
  const setFilter = (id: string, value: FilterValue | undefined) =>
    onQueryChange(queryWithFilter(query, id, value));

  return (
    <div
      {...rest}
      role="search"
      aria-label={ariaLabel ?? t(UI_KEYS.ui.filter_bar.landmark, { label: searchLabel })}
      className={["flex flex-wrap items-center gap-2", rest.className].filter(Boolean).join(" ")}
    >
      <SearchField
        aria-label={searchLabel}
        clearLabel={t(UI_KEYS.ui.filter_bar.clear_search)}
        value={query.search}
        onChange={(search) => onQueryChange({ ...query, search })}
        className="min-w-56 flex-1"
        {...(searchPlaceholder === undefined ? {} : { placeholder: searchPlaceholder })}
      />
      <Menu
        sections={[
          {
            id: "filters",
            title: t(UI_KEYS.ui.filter_bar.filters),
            isTitleHidden: true,
            items: addable,
          },
        ]}
        onAction={setEditingId}
        align="start"
      >
        <Button
          ref={addButton}
          variant="outline"
          size="sm"
          startIcon="plus"
          isDisabled={addable.length === 0}
        >
          {t(UI_KEYS.ui.filter_bar.add)}
        </Button>
      </Menu>
      {chipIds.map((id) => {
        const definition = definitionOf(id);
        if (definition === undefined) return null;
        const value = query.filterValues[id];
        return (
          <FilterChip
            key={id}
            definition={definition}
            value={value}
            locale={locale}
            isOpen={editingId === id}
            onOpenChange={(isOpen) => {
              setEditingId((current) => (isOpen ? id : current === id ? null : current));
              if (!isOpen && (value === undefined || isFilterValueEmpty(value))) focusAddButton();
            }}
            onChange={(next) => setFilter(id, next)}
            onRemove={() => {
              setFilter(id, undefined);
              setEditingId((current) => (current === id ? null : current));
              focusAddButton();
            }}
          />
        );
      })}
      {isResourceQueryFiltered(query) ? (
        <Button
          variant="ghost"
          size="sm"
          onPress={() => {
            setEditingId(null);
            onQueryChange(clearResourceQueryFilters(query));
            focusAddButton();
          }}
        >
          {t(UI_KEYS.ui.filter_bar.clear_all)}
        </Button>
      ) : null}
      <span role="status" className="sr-only">
        {t(UI_KEYS.ui.filter_bar.applied, { count: appliedIds.length })}
      </span>
    </div>
  );
}
