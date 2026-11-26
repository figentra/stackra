/**
 * Stackra file contract:
 * Purpose: the "plain" demo of the web BlueprintSection: one ruled band with its corner marks turned off
 *          (`hasMarks={false}`), for a quieter section.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0501 (section 9, the blueprint roles); ADR 0060 (light, dark, RTL); STA-2041.
 */
import { BlueprintSection, Heading, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { BLUEPRINT_SECTION_KEYS } from "#src/demos/free/blueprint-section/blueprint-section-keys.constant";

/** The demo's keys. */
const K = BLUEPRINT_SECTION_KEYS.blueprint_section.plain;

/** BlueprintSection: Without marks. */
export default function Plain() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="w-full max-w-xl p-2">
      <BlueprintSection label={t(K.label)} hasMarks={false} className="grid gap-2 p-8">
        <Heading level={3} type="h4">
          {t(K.title)}
        </Heading>
        <Text tone="muted">{t(K.text)}</Text>
      </BlueprintSection>
    </div>
  );
}
