/**
 * Stackra file contract:
 * Purpose: the "band" demo of the web BlueprintSection: two ruled bands stacked into one ruled column, each a named
 *          region with a heading and a line, the `+` marks at their top corners.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0501 (section 9, the blueprint roles); ADR 0060 (light, dark, RTL); STA-2041.
 */
import { BlueprintSection, Heading, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { BLUEPRINT_SECTION_KEYS } from "#src/demos/free/blueprint-section/blueprint-section-keys.constant";

/** The demo's keys. */
const K = BLUEPRINT_SECTION_KEYS.blueprint_section.band;

/** BlueprintSection: Ruled band. */
export default function Band() {
  const t = useCatalogueText(MESSAGES.en);
  const bands = [
    { id: "write", label: t(K.write), title: t(K.write_title), text: t(K.write_text) },
    { id: "expose", label: t(K.expose), title: t(K.expose_title), text: t(K.expose_text) },
  ];
  return (
    <div className="w-full max-w-xl p-2">
      {bands.map((band) => (
        <BlueprintSection
          key={band.id}
          id={`blueprint-section-band-${band.id}`}
          label={band.label}
          className="grid gap-2 p-8"
        >
          <Heading level={3} type="h4">
            {band.title}
          </Heading>
          <Text tone="muted">{band.text}</Text>
        </BlueprintSection>
      ))}
    </div>
  );
}
