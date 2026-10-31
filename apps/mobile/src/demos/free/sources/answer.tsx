/**
 * Stackra file contract:
 * Purpose: the "answer" demo of the native Sources: an answer with its three sources, open: two web pages and a document.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (component gaps, owner approval 2026-10-31).
 */
import { Sources, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SOURCES_DEMO_KEYS } from "#src/demos/free/sources/sources-demo-keys.constant";

/** The demo's keys. */
const K = SOURCES_DEMO_KEYS.demo_free.sources.answer;

/** Sources: an answer with its three sources, open: two web pages and a document. */
export default function Answer() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-2">
      <Text>{t(K.text)}</Text>
      <Sources
        defaultExpanded
        sources={[
          {
            key: "zatca",
            href: "https://zatca.gov.sa/en/RulesRegulations/Taxes/Pages/default.aspx",
            title: t(K.zatca),
            description: t(K.zatca_note),
          },
          { key: "gazette", href: "https://uqn.gov.sa/", title: t(K.gazette) },
          { key: "handbook", title: t(K.handbook) },
        ]}
      />
    </View>
  );
}
