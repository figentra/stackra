/**
 * Stackra file contract:
 * Purpose: the "chips" demo of the web Sources: single citation chips inside running text.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (component gaps, owner approval 2026-10-31).
 */
import { SourceChip, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SOURCES_KEYS } from "#src/demos/free/sources/sources-keys.constant";

/** The demo's keys. */
const K = SOURCES_KEYS.sources.chips;

/** Sources: single citation chips inside running text. */
export default function Chips() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Text className="max-w-xl">
      {t(K.before)} <SourceChip source={{ key: "news", href: "https://www.example.com/fees" }} />{" "}
      {t(K.after)} <SourceChip source={{ key: "zones", title: "zones-2026.pdf" }} />
    </Text>
  );
}
