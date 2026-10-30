/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native ComboBox: a pretend server filters and pages the list (`isServerFiltered`).
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { SelectItem } from "@stackra/ui/contracts";
import { ComboBox, Text, useCatalogueText } from "@stackra/ui/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { COMBO_BOX_DEMO_KEYS } from "#src/demos/free/combo-box/combo-box-demo-keys.constant";

/** The demo's keys. */
const K = COMBO_BOX_DEMO_KEYS.demo_free.combo_box.live;
const C = COMBO_BOX_DEMO_KEYS.demo_free.combo_box.countries;

/** The countries' ids, in the catalogue's order; Andorra is refused. */
const COUNTRIES = [
  "ar",
  "ad",
  "au",
  "at",
  "be",
  "br",
  "ca",
  "cl",
  "cz",
  "dk",
  "eg",
  "fi",
  "fr",
  "de",
  "gr",
  "in",
  "it",
  "jp",
  "ke",
  "mx",
  "nl",
  "no",
  "es",
  "se",
] as const;

/** How many countries the pretend server returns per page, and how long it takes to answer, in milliseconds. */
const PAGE_SIZE = 8;
const SERVER_DELAY = 400;

/** Type to search; the list is busy while the server answers, and its end loads the next page. */
export default function Live() {
  const [text, setText] = useState("");
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const t = useCatalogueText(MESSAGES.en);
  const countries: readonly SelectItem[] = COUNTRIES.map((id) => ({
    id,
    label: t(C[id]),
    isDisabled: id === "ad",
  }));
  const matches = countries.filter((country) =>
    country.label.toLocaleLowerCase().includes(text.trim().toLocaleLowerCase()),
  );
  const shown = isLoading ? [] : matches.slice(0, pages * PAGE_SIZE);

  // A pretend round trip for each new search or page; the timer is cleared when another one starts.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- reason: a demo of a busy state: the effect starts a pretend request and marks it busy
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), SERVER_DELAY);
    return () => clearTimeout(timer);
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- the text and the page count are the triggers of the pretend request this demo shows
  }, [text, pages]);

  return (
    <View className="gap-3">
      <ComboBox
        label={t(K.label)}
        items={shown}
        inputValue={text}
        onInputChange={(next) => {
          setText(next);
          setPages(1);
        }}
        isServerFiltered
        isLoading={isLoading}
        loadingLabel={t(K.loading)}
        onLoadMore={() => {
          if (!isLoading && shown.length < matches.length) setPages((page) => page + 1);
        }}
        emptyMessage={t(K.no_match)}
        value={chosen}
        onChange={setChosen}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {chosen === null ? t(K.none) : t(K.chosen, { key: chosen })}
      </Text>
      <Text tone="muted">{t(K.shown, { shown: shown.length, total: matches.length })}</Text>
    </View>
  );
}
