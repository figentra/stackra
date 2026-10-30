/**
 * Stackra file contract:
 * Purpose: the "pos-onboarding" demo of the web SetupGuide: a new POS terminal's checklist (printer, staff PINs, first shift) with read-only boxes the system ticks itself.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL); design-system gap inventory row 17.
 */
import { Button, SetupGuide as UiSetupGuide, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SETUP_GUIDE_KEYS } from "#src/demos/free/setup-guide/setup-guide-keys.constant";

/** The demo's keys. */
const K = SETUP_GUIDE_KEYS.setup_guide;

/** The terminal's tasks, in the order the system completes them. */
const STEPS = ["printer", "staff", "shift"] as const;

/** SetupGuide: POS onboarding. */
export default function PosOnboarding() {
  const t = useCatalogueText(MESSAGES.en);
  const [done, setDone] = useState(1);
  return (
    <div className="grid gap-3">
      <UiSetupGuide
        title={t(K.pos.title)}
        description={t(K.pos.description)}
        tasks={STEPS.map((id, index) => ({
          id,
          title: t(K.task[id]),
          description: t(K.task[`${id}_hint`]),
          isComplete: index < done,
        }))}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          isDisabled={done === STEPS.length}
          onPress={() => setDone((count) => count + 1)}
        >
          {t(K.pos.next_step)}
        </Button>
        <Button size="sm" variant="ghost" onPress={() => setDone(0)}>
          {t(K.pos.restart)}
        </Button>
      </div>
    </div>
  );
}
