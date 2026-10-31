/**
 * Stackra file contract:
 * Purpose: the web `FilterBar`: the search and filter row of a `useCollection` engine, on the shared contract. It draws
 *          a `SearchField` bound to the engine's search, an add-filter `Menu` that lists the quick filters (one per
 *          filterable column) not yet applied, one chip per applied quick filter, a read-only chip with a remove button
 *          for every other condition or group of the engine's filter, an "Advanced" popover with the whole and/or tree
 *          (`CollectionFilterEditor`), and a clear-all button shown only while the search or filter narrows the
 *          records. A chip is a button that opens that filter's editor in a `Popover` and a close button that removes
 *          the filter; choosing a filter from the menu adds its chip with the editor already open. A chip whose condition
 *          is in `unappliedIds` is drawn as a warning, led by a warning button whose name and tooltip say it is not
 *          applied. Every other `div` prop passes through to the root, which is a named `search` landmark.
 * Boundary: it holds no data state: every change goes to the engine (`useQuickFilters`), and only the bar's own
 *           editing state (which chip's popover is open) lives here. A quick filter is one top-level condition of the
 *           `CollectionFilter`, so a DataView or FilterPanel on the same engine shows the same filter. A filter whose
 *           value filters nothing has no chip once its editor closes (ADR 0318 decision 3),
 *           and focus then goes to the add-filter button, because the chip it was on is gone; removing a chip and
 *           clear-all do the same. A polite status line tells assistive technology how many filters are applied. It
 *           builds on `Popover`, `Menu`, `SearchField`, `Button` and `CloseButton` of earlier waves and, through
 *           `FilterEditor`, on NumberField and DateField, leaf groups of this wave (ADR 0318 decision 4). The
 *           words come from the `ui` catalogue in the active locale.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318 (decisions 1 to 4); ADR 0505 (one filter
 *          model); ADR 0165 (HeroUI v3 on
 *          web); owner decision 6 of STA-350 (thin wrappers); WCAG 2.2 SC 1.3.1, 2.1.1, 2.4.3, 2.5.8, 4.1.2, 4.1.3.
 */
import { useRef, useState, type ReactElement } from "react";
import { useLocale } from "react-aria-components";

import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { FilterValue } from "#contracts/types/filter-value.type";
import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import { filterChipTextOf } from "#core/functions/filter-chip-text-of.function";
import { quickFilterIdOf } from "#core/functions/quick-filter-id-of.function";
import { isFilterValueEmpty } from "#core/functions/is-filter-value-empty.function";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useQuickFilters } from "#react/hooks/use-quick-filters";
import { useUiText } from "#react/hooks/use-ui-text";
import { CollectionFilterEditor } from "#react/data-view/collection-filter-editor";
import { Chip } from "#react/chip/chip";
import { filterChipWordsOf } from "#core/functions/filter-chip-words-of.function";
import { Button } from "#react/button/button";
import { CloseButton } from "#react/close-button/close-button";
import { FilterEditor } from "#react/filter-bar/filter-editor";
import { IconButton } from "#react/icon-button/icon-button";
import { Menu } from "#react/menu/menu";
import { Popover } from "#react/popover/popover";
import { SearchField } from "#react/search-field/search-field";
import { Tooltip } from "#react/tooltip/tooltip";
import type { FilterBarProps } from "#react/filter-bar/filter-bar.props";

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
  /** True when the data source does not apply the filter: the chip is drawn as a warning. */
  readonly isUnapplied: boolean;
}

/** The warning that leads a chip the data source does not apply: a button named, and described, by the words. */
function UnappliedMark(): ReactElement {
  const t = useUiText();
  const words = t(UI_KEYS.ui.filter_bar.unapplied);
  return (
    <Tooltip content={words}>
      <IconButton
        icon="triangle-alert"
        label={words}
        variant="ghost"
        size="sm"
        className="text-warning"
      />
    </Tooltip>
  );
}

/** The classes of a chip group, drawn as a warning when the data source does not apply it. */
const groupClassOf = (isUnapplied: boolean) =>
  isUnapplied
    ? "inline-flex items-center gap-1 rounded-[var(--radius-control)] bg-warning-soft pe-1 text-warning"
    : "inline-flex items-center gap-1";

/** One filter as a chip: `Status: Paid`, opening its editor, with a button to remove it. */
function FilterChip({
  definition,
  value,
  locale,
  isOpen,
  onOpenChange,
  onChange,
  onRemove,
  isUnapplied,
}: FilterChipProps): ReactElement {
  const t = useUiText();
  const summary = filterChipTextOf(definition, value, locale, filterChipWordsOf(t));
  return (
    <div role="group" aria-label={definition.label} className={groupClassOf(isUnapplied)}>
      {isUnapplied ? <UnappliedMark /> : null}
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

/** No unapplied conditions, one array for every render. */
const NONE: readonly string[] = [];

/**
 * The search and filters of a `useCollection` engine. Put it in the `filterBar` slot of a `DataTable` given the same
 * engine.
 */
export function FilterBar<TItem extends CollectionItem = CollectionItem>({
  collection,
  searchLabel,
  searchPlaceholder,
  unappliedIds = NONE,
  "aria-label": ariaLabel,
  ...rest
}: FilterBarProps<TItem>): ReactElement {
  const t = useUiText();
  const { locale } = useLocale();
  const [editingId, setEditingId] = useState<string | null>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const { definitions, definitionOf, valueOf, appliedIds, others, setValue, clearAll } =
    useQuickFilters(collection);

  const chipIds =
    editingId !== null && definitionOf(editingId) !== undefined && !appliedIds.includes(editingId)
      ? [...appliedIds, editingId]
      : appliedIds;
  const addable: readonly MenuLeafItem[] = definitions
    .filter((filter) => !chipIds.includes(filter.id))
    .map((filter) => ({
      id: filter.id,
      label: filter.label,
      icon: filter.icon,
      isDisabled: filter.isDisabled,
    }));

  const focusAddButton = () => requestAnimationFrame(() => addButton.current?.focus());

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
        value={collection.state.search}
        onChange={collection.setSearch}
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
      <Popover
        title={t(UI_KEYS.ui.filter_bar.advanced)}
        placement="bottom"
        align="start"
        trigger={
          <Button variant="ghost" size="sm" startIcon="sliders-horizontal">
            {t(UI_KEYS.ui.filter_bar.advanced)}
          </Button>
        }
      >
        <div className="w-[min(40rem,calc(100vw-2rem))]">
          <CollectionFilterEditor collection={collection} label={searchLabel} />
        </div>
      </Popover>
      {chipIds.map((id) => {
        const definition = definitionOf(id);
        if (definition === undefined) return null;
        const value = valueOf(id);
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
            isUnapplied={unappliedIds.includes(quickFilterIdOf(id))}
            onChange={(next) => setValue(id, next)}
            onRemove={() => {
              setValue(id, undefined);
              setEditingId((current) => (current === id ? null : current));
              focusAddButton();
            }}
          />
        );
      })}
      {others.map((other) => (
        <div key={other.id} className={groupClassOf(unappliedIds.includes(other.id))}>
          {unappliedIds.includes(other.id) ? <UnappliedMark /> : null}
          <Chip
            variant="secondary"
            {...(unappliedIds.includes(other.id) ? { tone: "warning" as const } : {})}
          >
            {other.text}
          </Chip>
          <CloseButton
            label={t(UI_KEYS.ui.filter_bar.remove, { label: other.text })}
            onPress={() => {
              other.remove();
              focusAddButton();
            }}
          />
        </div>
      ))}
      {collection.isFiltered ? (
        <Button
          variant="ghost"
          size="sm"
          onPress={() => {
            setEditingId(null);
            clearAll();
            focusAddButton();
          }}
        >
          {t(UI_KEYS.ui.filter_bar.clear_all)}
        </Button>
      ) : null}
      <span role="status" className="sr-only">
        {t(UI_KEYS.ui.filter_bar.applied, { count: appliedIds.length + others.length })}
      </span>
    </div>
  );
}
