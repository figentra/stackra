/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Autocomplete: a billing country picked from a list that opens with a search
 *          box, with its own search and clear words, a no-match message and the chosen country read back.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0055 (one field contract); ADR 0060 (light, dark, RTL); STA-1981.
 */
import { Autocomplete, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { AUTOCOMPLETE_KEYS } from "#src/demos/free/autocomplete/autocomplete-keys.constant";

/** The demo's keys. */
const K = AUTOCOMPLETE_KEYS.autocomplete;

/** The Autocomplete demo: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [country, setCountry] = useState<string | null>(null);
  /** The countries to pick from, keyed by ISO 3166-1 code. */
  const COUNTRIES = [
    { id: "sa", label: t(K.sample.saudi_arabia) },
    { id: "ae", label: t(K.sample.united_arab_emirates) },
    { id: "eg", label: t(K.sample.egypt) },
    { id: "jo", label: t(K.sample.jordan) },
    { id: "kw", label: t(K.sample.kuwait) },
    { id: "qa", label: t(K.sample.qatar) },
    { id: "bh", label: t(K.sample.bahrain) },
    { id: "om", label: t(K.sample.oman) },
    { id: "gb", label: t(K.sample.united_kingdom) },
    { id: "de", label: t(K.sample.germany) },
    { id: "us", label: t(K.sample.united_states) },
  ] as const;
  const chosen = COUNTRIES.find(({ id }) => id === country)?.label ?? t(K.basics.none);
  return (
    <div className="grid w-72 gap-2">
      <Autocomplete
        items={COUNTRIES}
        label={t(K.basics.label)}
        placeholder={t(K.basics.placeholder)}
        description={t(K.basics.description)}
        emptyMessage={t(K.basics.empty)}
        labels={{ search: t(K.basics.search), clear: t(K.basics.clear) }}
        value={country}
        onChange={setCountry}
        isFullWidth
      />
      <Text type="small" tone="muted" role="status">
        {t(K.basics.chosen, { country: chosen })}
      </Text>
    </div>
  );
}
