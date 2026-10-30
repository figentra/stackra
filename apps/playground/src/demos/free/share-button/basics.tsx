/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web ShareButton: an order's receipt link, shared through the system sheet where
 *          the browser has one and copied where it has none, with what happened written under it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave C, owner approval 2026-10-29).
 */
import { ShareButton, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { SHARE_BUTTON_KEYS } from "#src/demos/free/share-button/share-button-keys.constant";

/** The demo's keys. */
const K = SHARE_BUTTON_KEYS.share_button.basics;

/** The receipt's link (a link, never translated). */
const RECEIPT = "https://shop.example/r/2048";

/** Shares a receipt link and says when it was shared. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [outcome, setOutcome] = useState<"shared" | "copied" | null>(null);
  return (
    <div className="grid justify-items-start gap-3">
      <ShareButton url={RECEIPT} title={t(K.title)} text={t(K.text)} onShare={setOutcome} />
      {outcome ? <Text tone="muted">{t(K[outcome])}</Text> : null}
    </div>
  );
}
