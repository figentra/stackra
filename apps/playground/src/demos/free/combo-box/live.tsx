/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Combo box: Type to search a list held by a pretend server: the list is busy
 *          while it answers, and scrolling to its end loads the next page.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0055; ADR 0060 (light, dark, RTL).
 */
import { ComboBox as UiComboBox, Text, useCatalogueText } from "@stackra/ui/react";
import { useEffect, useRef, useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { COMBO_BOX_KEYS } from "#src/demos/free/combo-box/combo-box-keys.constant";

/** The demo's keys. */
const K = COMBO_BOX_KEYS.combo_box;

/** How many countries the pretend server returns per page, and how long it takes to answer, in milliseconds. */
const PAGE_SIZE = 8;

const SERVER_DELAY = 400;

/** The width of a sample field, so its label and error wrap the same way in every sample. */
const SAMPLE = "w-72";

/** Combo box: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  /** The countries of the samples, and of the pretend server. */
  const COUNTRIES = [
    { id: "ar", label: t(K.sample.argentina) },
    { id: "ad", label: t(K.sample.andorra), isDisabled: true },
    { id: "au", label: t(K.sample.australia) },
    { id: "at", label: t(K.sample.austria) },
    { id: "be", label: t(K.sample.belgium) },
    { id: "br", label: t(K.sample.brazil) },
    { id: "ca", label: t(K.sample.canada) },
    { id: "cl", label: t(K.sample.chile) },
    { id: "cz", label: t(K.sample.czechia) },
    { id: "dk", label: t(K.sample.denmark) },
    { id: "eg", label: t(K.sample.egypt) },
    { id: "fi", label: t(K.sample.finland) },
    { id: "fr", label: t(K.sample.france) },
    { id: "de", label: t(K.sample.germany) },
    { id: "gr", label: t(K.sample.greece) },
    { id: "in", label: t(K.sample.india) },
    { id: "it", label: t(K.sample.italy) },
    { id: "jp", label: t(K.sample.japan) },
    { id: "ke", label: t(K.sample.kenya) },
    { id: "mx", label: t(K.sample.mexico) },
    { id: "nl", label: t(K.sample.netherlands) },
    { id: "no", label: t(K.sample.norway) },
    { id: "es", label: t(K.sample.spain) },
    { id: "se", label: t(K.sample.sweden) },
  ] as const;
  const [chosen, setChosen] = useState<string | null>(null);

  const [applied, setApplied] = useState("");

  const [limit, setLimit] = useState(PAGE_SIZE);

  const [isLoading, setIsLoading] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  // The pretend server: it answers after a moment, with the matches so far, a page at a time.
  const matches = COUNTRIES.filter((country) =>
    country.label.toLowerCase().includes(applied.toLowerCase()),
  );

  const answer = (then: () => void) => {
    setIsLoading(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      then();
      setIsLoading(false);
    }, SERVER_DELAY);
  };

  const search = (text: string) =>
    answer(() => {
      setApplied(text);
      setLimit(PAGE_SIZE);
    });

  const loadMore = () => {
    if (isLoading || limit >= matches.length) return;
    answer(() => setLimit((current) => current + PAGE_SIZE));
  };

  const page = matches.slice(0, limit);

  return (
    <div className="grid gap-6">
      <UiComboBox
        items={page}
        label={t(K.live_label)}
        placeholder={t(K.country_placeholder)}
        isServerFiltered
        isLoading={isLoading}
        loadingLabel={t(K.live_loading)}
        onInputChange={search}
        onLoadMore={loadMore}
        emptyMessage={t(K.no_match_message)}
        value={chosen}
        onChange={setChosen}
        className={SAMPLE}
      />
      <Text role="status" data-testid="combo-box-chosen" tone="muted">
        {t(K.chosen, { key: chosen ?? "none" })}
      </Text>
      <Text data-testid="combo-box-shown" tone="muted">
        {t(K.shown, { shown: page.length, total: matches.length })}
      </Text>
    </div>
  );
}
