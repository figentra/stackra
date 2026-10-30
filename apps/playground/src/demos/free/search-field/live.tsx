/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Search field: Type to filter the products; the field is busy while it searches.
 *          Enter submits the text and the clear button empties it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0055; ADR 0060 (light, dark, RTL).
 */
import { SearchField as UiSearchField, Text, useCatalogueText } from "@stackra/ui/react";
import { useEffect, useRef, useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SEARCH_FIELD_KEYS } from "#src/demos/free/search-field/search-field-keys.constant";

/** The demo's keys. */
const K = SEARCH_FIELD_KEYS.search_field;

/** The products the live example filters. */
const PRODUCTS = [
  "Blue shirt",
  "Black shirt",
  "Ceramic mug",
  "Travel mug",
  "Desk lamp",
  "Floor lamp",
  "Canvas bag",
  "Steel bottle",
] as const;

/** How long the simulated search takes, in milliseconds. */
const SEARCH_DELAY = 400;

/** The width of a sample field, so its label and error wrap the same way in every sample. */
const SAMPLE = "w-72";

/** Search field: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [query, setQuery] = useState("");

  const [applied, setApplied] = useState("");

  const [isSearching, setIsSearching] = useState(false);

  const [message, setMessage] = useState<string>(t(K.none));

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const search = (next: string) => {
    setQuery(next);
    setIsSearching(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setApplied(next);
      setIsSearching(false);
    }, SEARCH_DELAY);
  };

  const results = PRODUCTS.filter((name) => name.toLowerCase().includes(applied.toLowerCase()));

  return (
    <div className="grid gap-6">
      <UiSearchField
        label={t(K.live_label)}
        placeholder={t(K.live_placeholder)}
        clearLabel={t(K.live_clear)}
        value={query}
        onChange={search}
        isLoading={isSearching}
        onSubmit={(text) => setMessage(t(K.submitted, { text }))}
        onClear={() => setMessage(t(K.cleared))}
        className={SAMPLE}
      />
      <Text role="status" tone="muted">
        {isSearching ? "" : t(K.count, { total: results.length })}
      </Text>
      <Text data-testid="search-message" tone="muted">
        {message}
      </Text>
      <ul aria-label={t(K.results)} className="grid gap-1">
        {results.map((name) => (
          <li key={name}>
            <Text>{name}</Text>
          </li>
        ))}
      </ul>
    </div>
  );
}
