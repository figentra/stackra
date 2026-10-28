/**
 * Stackra file contract:
 * Purpose: `SearchPalette`, the web Cmd+K search palette (ADR 0221 d4): a modal with one search field that searches
 *          every source model's generated search query (`<model>.search`) as the reader types, draws each model's hits
 *          in source order, and hands the picked hit to the caller before it closes.
 * Boundary: draws and fetches only; what a hit opens is the caller's `onSelect`, and the app's own `Shortcut`
 *           (`mod+k`) opens it, so key conflicts stay with the shortcut registry. A phrase is searched once typing
 *           settles for 200 ms, and nothing is searched for an empty phrase. Visibility is the server's: each query
 *           runs under the caller's scope, row-level security and record visibility.
 * Runtime: browser
 * Governing contract: ADR 0221 (decisions 4 and 6, settled 2026-10-29); ADR 0260 (decision 4); ADR 0307 (rule 4).
 */
import { useTranslation } from "@stackra/i18n/react";
import { EmptyState, Modal, SearchField } from "@stackra/ui/react";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import type { SearchPaletteHit } from "#react/search-palette/search-palette-hit.type";
import { SearchPaletteGroup } from "#react/search-palette/search-palette-group";
import type { SearchPaletteSource } from "#react/search-palette/search-palette-source.type";
import type { SearchPaletteProps } from "#react/search-palette/search-palette.props";

/** How long typing must pause before the phrase is searched. */
const SETTLE_MS = 200;

/** Hits per model when the props name no limit. */
const DEFAULT_LIMIT = 5;

/**
 * The search palette.
 *
 * @example
 * <SearchPalette
 *   sources={[{ query: SearchProductQuery, label: t(I18n.catalog.product.plural) }]}
 *   isOpen={isOpen}
 *   onOpenChange={setOpen}
 *   onSelect={(source, hit) => navigate(productView({ id: hit.id }))}
 * />
 */
export function SearchPalette({
  sources,
  isOpen,
  onOpenChange,
  onSelect,
  limit = DEFAULT_LIMIT,
}: SearchPaletteProps): ReactElement {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [phrase, setPhrase] = useState("");
  // Each model's last answered count; a model keeps its previous hits (and count) while the next phrase loads.
  const [counts, setCounts] = useState<ReadonlyMap<string, number>>(new Map());
  useEffect(() => {
    const timer = setTimeout(() => setPhrase(text.trim()), SETTLE_MS);
    return () => clearTimeout(timer);
  }, [text]);
  const onCount = useCallback(
    (key: string, count: number) =>
      setCounts((current) =>
        current.get(key) === count ? current : new Map(current).set(key, count),
      ),
    [],
  );
  const pick = (source: SearchPaletteSource, hit: SearchPaletteHit) => {
    onSelect(source, hit);
    onOpenChange(false);
  };
  const isEmpty =
    phrase !== "" &&
    sources.length > 0 &&
    sources.every((source) => counts.get(source.query.key) === 0);
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      position="top"
      label={t(PANEL_KEYS.panel.search_palette.label)}
    >
      <Modal.Body>
        <SearchField
          label={t(PANEL_KEYS.panel.search_palette.label)}
          placeholder={t(PANEL_KEYS.panel.search_palette.placeholder)}
          value={text}
          onChange={setText}
          isFullWidth
        />
        {phrase !== "" &&
          sources.map((source) => (
            <SearchPaletteGroup
              key={source.query.key}
              source={source}
              phrase={phrase}
              limit={limit}
              onCount={onCount}
              onSelect={pick}
            />
          ))}
        {isEmpty && (
          <EmptyState reason="no-results" title={t(PANEL_KEYS.panel.search_palette.empty)} />
        )}
      </Modal.Body>
    </Modal>
  );
}
