/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Morph button: a payment that spins, then succeeds or asks to try again.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL).
 */
import type { MorphButtonState } from "@stackra/ui/contracts";
import { MorphButton, Switch, useCatalogueText } from "@stackra/ui/react";
import { useEffect, useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { MORPH_BUTTON_KEYS } from "#src/demos/free/morph-button/morph-button-keys.constant";

/** The demo's keys. */
const K = MORPH_BUTTON_KEYS.morph_button;

/** Morph button: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [state, setState] = useState<MorphButtonState>("idle");
  const [willFail, setWillFail] = useState(false);
  // The payment answers after 1.2 s; the button settles back to its label by itself after success.
  useEffect(() => {
    if (state !== "loading") return undefined;
    const timer = setTimeout(() => setState(willFail ? "error" : "success"), 1200);
    return () => clearTimeout(timer);
  }, [state, willFail]);
  return (
    <div className="grid justify-items-start gap-4">
      <MorphButton
        state={state}
        labels={{ idle: t(K.pay), loading: t(K.paying), success: t(K.paid), error: t(K.failed) }}
        onPress={() => setState("loading")}
        onSuccessEnd={() => setState("idle")}
      />
      <Switch label={t(K.fail_next)} value={willFail} onChange={setWillFail} />
    </div>
  );
}
