/**
 * Stackra file contract:
 * Purpose: the "complete" demo of the native SetupGuide: every task done, so it starts folded with its done line.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { SetupGuide, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SETUP_GUIDE_DEMO_KEYS } from "#src/demos/free/setup-guide/setup-guide-demo-keys.constant";

/** The demo's keys. */
const K = SETUP_GUIDE_DEMO_KEYS.demo_free.setup_guide;

/** All done. */
export default function Complete() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <SetupGuide
      title={t(K.pos_title)}
      tasks={(["printer", "staff", "shift"] as const).map((id) => ({
        id,
        title: t(K[id]),
        isComplete: true,
      }))}
    />
  );
}
