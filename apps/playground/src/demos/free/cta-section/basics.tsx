/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web CtaSection block (@stackra/experience): a start-free call to action with two buttons, and a newsletter sign-up under it.
 * Boundary: a demo with no props: the kit block, @stackra/ui and local state only; every word from the catalogue and
 *           every price and option as demo data. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0503 (module UI kits).
 */
import { CtaSection } from "@stackra/experience/react";
import { Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { CTA_SECTION_KEYS } from "#src/demos/free/cta-section/cta-section-keys.constant";

/** The demo's keys. */
const K = CTA_SECTION_KEYS.cta_section.basics;

/** Call to action: buttons, then a newsletter. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [pressed, setPressed] = useState("");
  const actions = [
    { id: "start", label: t(K.start) },
    { id: "demo", label: t(K.demo) },
  ];
  return (
    <div className="grid w-full gap-6">
      <CtaSection
        title={t(K.title)}
        description={t(K.description)}
        actions={actions}
        onAction={(id) =>
          setPressed(t(K.pressed, { action: actions.find((a) => a.id === id)?.label ?? id }))
        }
      />
      <Text tone="muted" type="small" role="status">
        {pressed}
      </Text>
      <CtaSection
        title={t(K.news_title)}
        newsletter={{
          label: t(K.news_label),
          placeholder: t(K.news_placeholder),
          submit: t(K.news_submit),
          note: t(K.news_note),
          thanks: t(K.news_thanks),
        }}
        onSubscribe={() => {}}
      />
    </div>
  );
}
