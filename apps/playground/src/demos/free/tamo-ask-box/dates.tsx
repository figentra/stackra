/**
 * Stackra file contract:
 * Purpose: the "dates" demo of the web tamo-ask-box: a delivery day asked in words, proposed by the offline mock and picked on Apply.
 * Boundary: a demo with no props: @stackra/ui, @stackra/ai's offline mock client and local state only; every word
 *           from the catalogue. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0507 (Ask Tamo).
 */
import { createMockTamoClient } from "@stackra/ai/react";
import { TamoAskBox, Text, useCatalogueText, useDesignSystem } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { TAMO_ASK_BOX_KEYS } from "#src/demos/free/tamo-ask-box/tamo-ask-box-keys.constant";

/** The demo's keys. */
const K = TAMO_ASK_BOX_KEYS.tamo_ask_box;
/** The offline client: plain rules, no keys, no network. */
const CLIENT = createMockTamoClient();
/** The day the words count from, fixed so the demo reads the same every day. */
const TODAY = "2026-10-31";

/** Tamo ask box: dates in words. */
export default function Dates() {
  const t = useCatalogueText(MESSAGES.en);
  const { locale } = useDesignSystem();
  const [picked, setPicked] = useState("");
  return (
    <div className="grid max-w-md gap-3">
      <TamoAskBox<{ readonly start: string }>
        label={t(K.label)}
        placeholder={t(K.placeholder)}
        onAsk={(text, signal) =>
          CLIENT.run("date", { text, locale, today: TODAY, isRange: false }, signal, {})
        }
        renderProposal={(proposal) => <Text>{proposal.start}</Text>}
        onApply={(proposal) => setPicked(proposal.start)}
      />
      <Text type="small" tone="muted" role="status">
        {picked === "" ? "" : t(K.picked, { date: picked })}
      </Text>
    </div>
  );
}
