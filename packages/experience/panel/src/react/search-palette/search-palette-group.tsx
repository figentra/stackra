/**
 * Stackra file contract:
 * Purpose: `SearchPaletteGroup`, one model's hits in the search palette: it runs the model's search query for the
 *          phrase and draws each hit as a row that picks it, or the failure with a retry.
 * Boundary: internal to the palette; one per source, so each model's query has its own hook and cache entry. The answer
 *           comes from `useQuery`, which keeps the previous hits while the next phrase loads. A model with no hits
 *           draws nothing; it reports its count so the palette draws the one empty state.
 * Runtime: browser
 * Governing contract: ADR 0221 (decision 4, settled 2026-10-29); ADR 0260 (decision 4).
 */
import { useQuery } from "@stackra/clients/react";
import { useTranslation } from "@stackra/i18n/react";
import { ErrorState, List } from "@stackra/ui/react";
import { useEffect, type ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import type { SearchPaletteGroupProps } from "#react/search-palette/search-palette-group.props";
import type { SearchPaletteHit } from "#react/search-palette/search-palette-hit.type";

/**
 * One model's hits.
 *
 * @example
 * <SearchPaletteGroup source={source} phrase="linen" limit={5} onCount={count} onSelect={pick} />
 */
export function SearchPaletteGroup({
  source,
  phrase,
  limit,
  onCount,
  onSelect,
}: SearchPaletteGroupProps): ReactElement | null {
  const { t } = useTranslation();
  const answer = useQuery(source.query, { q: phrase, limit }, { keepPreviousData: true });
  // The ref's output schema is a generated search query's, `{ hits }`; the transport decoded it.
  const hits = (answer.data as { readonly hits: readonly SearchPaletteHit[] } | undefined)?.hits;
  const count = answer.isPending ? undefined : (hits?.length ?? 0);
  useEffect(() => {
    if (count !== undefined) onCount(source.query.key, count);
  }, [count, onCount, source.query.key]);
  if (answer.error)
    return (
      <ErrorState
        title={t(PANEL_KEYS.panel.search_palette.failed, { source: source.label })}
        error={answer.error}
        retry={{
          label: t(PANEL_KEYS.panel.widgets.retry),
          onPress: () => void answer.refetch(),
        }}
      />
    );
  if (!answer.isPending && (hits === undefined || hits.length === 0)) return null;
  return (
    <List
      label={source.label}
      isLoading={answer.isPending}
      loadingLabel={t(PANEL_KEYS.panel.search_palette.loading, { source: source.label })}
      isAnimated={false}
      items={(hits ?? []).map((hit) => ({
        id: hit.id,
        title: hit.title,
        description: hit.snippet,
        endContent: source.label,
        onPress: () => onSelect(source, hit),
      }))}
    />
  );
}
