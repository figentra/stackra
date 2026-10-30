/**
 * Stackra file contract:
 * Purpose: the web `FilterPanel`: the faceted filters of a resource index. Saved views are tabs that apply their
 *          whole query; a sort menu picks the column and the direction; the applied filters are clearable chips with
 *          a clear-all button; the result count rolls to its new value; and the facets (each filter's editor, choice
 *          options labelled with their counts) sit in an inline side panel from 768px up and in a drawer opened by a
 *          "Filters" button below it.
 * Boundary: controlled only, as `FilterBar` is: each change calls `onQueryChange` with the whole next query and the
 *           counts are the app's. It builds on `FilterEditor`, `Menu`, `Drawer`, `Chip`, `CloseButton` and HeroUI's
 *           tab list. The chip enter and exit and the count roll are `motion`'s and stop under prefers-reduced-motion.
 *           The words come from the `ui` catalogue in the active locale.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318 (decisions 1 to 3); ADR 0329 (motion
 *          layer); design-system gap inventory (2026-10-28) row 9; WCAG 2.2 SC 1.3.1, 2.1.1, 2.4.3, 4.1.2, 4.1.3.
 */
import { Tabs as HeroTabs, cn, useMediaQuery } from "@heroui/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactElement } from "react";
import { useLocale } from "react-aria-components";

import type { AriaSortDirection } from "#contracts/enums/aria-sort-direction.enum";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { clearResourceQueryFilters } from "#core/functions/clear-resource-query-filters.function";
import { facetDefinitionOf } from "#core/functions/facet-definition-of.function";
import { filterChipTextOf } from "#core/functions/filter-chip-text-of.function";
import { filterChipWordsOf } from "#core/functions/filter-chip-words-of.function";
import { isFilterValueEmpty } from "#core/functions/is-filter-value-empty.function";
import { isResourceQueryFiltered } from "#core/functions/is-resource-query-filtered.function";
import { queryWithFilter } from "#core/functions/query-with-filter.function";
import { Button } from "#react/button/button";
import { Chip } from "#react/chip/chip";
import { CloseButton } from "#react/close-button/close-button";
import { Drawer } from "#react/drawer/drawer";
import { FilterEditor } from "#react/filter-bar/filter-editor";
import { useUiText } from "#react/hooks/use-ui-text";
import { Menu } from "#react/menu/menu";
import type { FilterPanelProps } from "#react/filter-panel/filter-panel.props";

/** The width from which the facets sit beside the results instead of in a drawer. */
const DESKTOP = "(min-width: 768px)";

/** How a chip and the count move, in seconds. */
const MOVE_SECONDS = 0.18;

/** The default for an unset list prop: one stable empty array, not a new one each render. */
const NONE: readonly never[] = [];

/** Facets with counts, applied-filter chips, saved views and a sort menu. Controlled. */
export function FilterPanel({
  query,
  onQueryChange,
  filters,
  label,
  counts,
  resultCount,
  views = NONE,
  activeViewId,
  onViewChange,
  sortOptions = NONE,
  className,
  ...rest
}: FilterPanelProps): ReactElement {
  const t = useUiText();
  const { locale } = useLocale();
  const isDesktop = useMediaQuery(DESKTOP);
  const isReduced = useReducedMotion() ?? false;
  const move = { duration: isReduced ? 0 : MOVE_SECONDS };
  const words = filterChipWordsOf(t);
  const applied = filters.filter((filter) => {
    const value = query.filterValues[filter.id];
    return value !== undefined && !isFilterValueEmpty(value);
  });

  const facets = (
    <div className="grid gap-5">
      {filters.map((filter) => (
        <fieldset key={filter.id} className="grid gap-2" disabled={filter.isDisabled ?? false}>
          <legend className="mb-2 text-sm font-medium text-foreground">{filter.label}</legend>
          <FilterEditor
            definition={facetDefinitionOf(filter, counts?.[filter.id], (option, count) =>
              t(UI_KEYS.ui.filter_panel.facet_option, { label: option, count }),
            )}
            value={query.filterValues[filter.id]}
            onChange={(value) => onQueryChange(queryWithFilter(query, filter.id, value))}
          />
        </fieldset>
      ))}
    </div>
  );

  const sort = query.sort;
  const sortMenu =
    sortOptions.length === 0 ? null : (
      <Menu
        selectionMode="single"
        align="end"
        sections={[
          {
            id: "column",
            title: t(UI_KEYS.ui.table.sort_by),
            items: sortOptions.map((option) => ({ id: option.column, label: option.label })),
          },
          {
            id: "direction",
            title: t(UI_KEYS.ui.filter_panel.order),
            items: [
              { id: "ascending", label: t(UI_KEYS.ui.table.ascending) },
              { id: "descending", label: t(UI_KEYS.ui.table.descending) },
            ],
          },
        ]}
        value={sort === null ? [] : [sort.column, sort.direction]}
        onChange={(chosen) => {
          const direction = (chosen.find((id) => id === "ascending" || id === "descending") ??
            "ascending") as AriaSortDirection;
          const column = chosen.find((id) => sortOptions.some((option) => option.column === id));
          if (column !== undefined) onQueryChange({ ...query, sort: { column, direction } });
        }}
      >
        <Button variant="outline" size="sm" startIcon="arrow-up-down">
          {t(UI_KEYS.ui.filter_panel.sort)}
        </Button>
      </Menu>
    );

  return (
    <section
      {...rest}
      aria-label={label}
      className={cn("grid gap-4 md:grid-cols-[16rem_1fr] md:items-start", className)}
    >
      {isDesktop ? (
        // A group, not an aside: a page can hold several panels, and each aside would be a landmark of the same name.
        <div role="group" aria-label={t(UI_KEYS.ui.filter_bar.filters)} className="md:row-span-2">
          {facets}
        </div>
      ) : null}
      <div className="grid min-w-0 gap-3">
        {views.length > 0 ? (
          <HeroTabs
            selectedKey={activeViewId ?? views[0]?.id ?? ""}
            onSelectionChange={(key) => {
              const view = views.find((candidate) => candidate.id === key);
              if (view === undefined) return;
              onQueryChange(view.query);
              onViewChange?.(view.id);
            }}
          >
            <HeroTabs.ListContainer>
              <HeroTabs.List aria-label={t(UI_KEYS.ui.filter_panel.views)}>
                {views.map((view) => (
                  <HeroTabs.Tab key={view.id} id={view.id}>
                    <span className="relative z-10">{view.label}</span>
                    <HeroTabs.Indicator />
                  </HeroTabs.Tab>
                ))}
              </HeroTabs.List>
            </HeroTabs.ListContainer>
            {/* A view filters the results below rather than showing a panel of its own; the hidden panel is there so
                the selected tab's aria-controls names an element. */}
            {views.map((view) => (
              <HeroTabs.Panel key={view.id} id={view.id} className="hidden">
                {null}
              </HeroTabs.Panel>
            ))}
          </HeroTabs>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          {isDesktop ? null : (
            <Drawer
              placement="bottom"
              trigger={
                <Button variant="outline" size="sm" startIcon="sliders-horizontal">
                  {t(UI_KEYS.ui.filter_bar.filters)}
                </Button>
              }
            >
              <Drawer.Header>
                <Drawer.Title>{label}</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body>{facets}</Drawer.Body>
              <Drawer.Footer>
                <Button slot="close" variant="primary">
                  {t(UI_KEYS.ui.filter_bar.done)}
                </Button>
              </Drawer.Footer>
            </Drawer>
          )}
          {sortMenu}
          {resultCount === undefined ? null : (
            <span role="status" className="ms-auto inline-flex overflow-hidden text-sm text-muted">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={resultCount}
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-100%", opacity: 0 }}
                  transition={move}
                >
                  {t(UI_KEYS.ui.filter_panel.results, { count: resultCount })}
                </motion.span>
              </AnimatePresence>
            </span>
          )}
        </div>
        {applied.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <ul aria-label={t(UI_KEYS.ui.filter_panel.applied)} className="flex flex-wrap gap-2">
              <AnimatePresence initial={false}>
                {applied.map((filter) => {
                  const summary = filterChipTextOf(
                    filter,
                    query.filterValues[filter.id],
                    locale,
                    words,
                  );
                  return (
                    <motion.li
                      key={filter.id}
                      layout={!isReduced}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={move}
                      className="inline-flex items-center gap-1"
                    >
                      <Chip variant="secondary">{`${filter.label}: ${summary}`}</Chip>
                      <CloseButton
                        label={t(UI_KEYS.ui.filter_bar.remove, { label: filter.label })}
                        onPress={() => onQueryChange(queryWithFilter(query, filter.id, undefined))}
                      />
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
            {isResourceQueryFiltered(query) ? (
              <Button
                variant="ghost"
                size="sm"
                onPress={() => onQueryChange(clearResourceQueryFilters(query))}
              >
                {t(UI_KEYS.ui.filter_bar.clear_all)}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
