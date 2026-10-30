/**
 * Stackra file contract:
 * Purpose: the "demo" demo of the web Mode switch: the developer display mode turned on and off, with the current
 *          mode read out.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL).
 */
import { ModeSwitch, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { MODE_SWITCH_KEYS } from "#src/demos/free/mode-switch/mode-switch-keys.constant";

/** The demo's keys. */
const K = MODE_SWITCH_KEYS.mode_switch;

/** Mode switch: Display mode. */
export default function Demo() {
  const t = useCatalogueText(MESSAGES.en);
  const [mode, setMode] = useState<"normal" | "developer">("normal");
  return (
    <div className="grid max-w-xl gap-3">
      <ModeSwitch
        label={t(K.label)}
        description={t(K.description)}
        mode={mode}
        onModeChange={setMode}
      />
      <Text role="status" type="small" tone="muted">
        {t(K.current, { mode })}
      </Text>
    </div>
  );
}
