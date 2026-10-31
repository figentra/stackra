/**
 * Stackra file contract:
 * Purpose: the web `FilterPanel`: the faceted filters of a `useCollection` engine. The applied filters are clearable
 *          chips with a clear-all button; the result count rolls to its new value; and the facets (one per filterable
 *          column: its editor, choice options labelled with their counts) sit in an inline side panel from 768px up
 *          and in a drawer opened by a "Filters" button below it.
 * Boundary: it keeps no data state: each facet is one top-level condition of the engine's filter (`useQuickFilters`,
 *           ADR 0505) and the counts are the app's. Saved views are `SavedViews` and the sort is the toolbar's (the
 *           panel's own tabs and sort menu were removed on 2026-10-31). It builds on `FilterEditor`, `Drawer`, `Chip`
 *           and `CloseButton`. The chip enter and exit and the count roll are `motion`'s and stop under prefers-reduced-motion.
 *           The words come from the `ui` catalogue in the active locale.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0505 (one filter model); ADR 0329 (motion
 *          layer); design-system gap inventory (2026-10-28) row 9; WCAG 2.2 SC 1.3.1, 2.1.1, 2.4.3, 4.1.2, 4.1.3.
 */
import { cn, useMediaQuery } from "@heroui/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactElement } from "react";
import { useLocale } from "react-aria-components";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { facetDefinitionOf } from "#core/functions/facet-definition-of.function";
import { filterChipTextOf } from "#core/functions/filter-chip-text-of.function";
import { filterChipWordsOf } from "#core/functions/filter-chip-words-of.function";
import { Button } from "#react/button/button";
import { Chip } from "#react/chip/chip";
import { CloseButton } from "#react/close-button/close-button";
import { Drawer } from "#react/drawer/drawer";
import { FilterEditor } from "#react/filter-bar/filter-editor";
import { useQuickFilters } from "#react/hooks/use-quick-filters";
import { useUiText } from "#react/hooks/use-ui-text";
import type { FilterPanelProps } from "#react/filter-panel/filter-panel.props";

/** The width from which the facets sit beside the results instead of in a drawer. */
const DESKTOP = "(min-width: 768px)";

/** How a chip and the count move, in seconds. */
const MOVE_SECONDS = 0.18;

/** Facets with counts and applied-filter chips over a `useCollection` engine. */
export function FilterPanel<TItem extends CollectionItem = CollectionItem>({
  collection,
  label,
  counts,
  resultCount = collection.totalCount,
  className,
  ...rest
}: FilterPanelProps<TItem>): ReactElement {
  const t = useUiText();
  const { locale } = useLocale();
  const isDesktop = useMediaQuery(DESKTOP);
  const isReduced = useReducedMotion() ?? false;
  const move = { duration: isReduced ? 0 : MOVE_SECONDS };
  const words = filterChipWordsOf(t);
  const {
    definitions: filters,
    valueOf,
    appliedIds,
    setValue,
    clearAll,
  } = useQuickFilters(collection);
  const applied = filters.filter((filter) => appliedIds.includes(filter.id));

  const facets = (
    <div className="grid gap-5">
      {filters.map((filter) => (
        <fieldset key={filter.id} className="grid gap-2" disabled={filter.isDisabled ?? false}>
          <legend className="mb-2 text-sm font-medium text-foreground">{filter.label}</legend>
          <FilterEditor
            definition={facetDefinitionOf(filter, counts?.[filter.id], (option, count) =>
              t(UI_KEYS.ui.filter_panel.facet_option, { label: option, count }),
            )}
            value={valueOf(filter.id)}
            onChange={(value) => setValue(filter.id, value)}
          />
        </fieldset>
      ))}
    </div>
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
                  const summary = filterChipTextOf(filter, valueOf(filter.id), locale, words);
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
                        onPress={() => setValue(filter.id, undefined)}
                      />
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
            {collection.isFiltered ? (
              <Button variant="ghost" size="sm" onPress={clearAll}>
                {t(UI_KEYS.ui.filter_bar.clear_all)}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
