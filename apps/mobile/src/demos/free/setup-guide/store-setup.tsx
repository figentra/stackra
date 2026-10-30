/**
 * Stackra file contract:
 * Purpose: the "store-setup" demo of the native SetupGuide: a café's first steps, ticked by the page, with a call to action on the open menu task; the list folds and a success haptic plays at 100%.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { SetupGuide, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { SETUP_GUIDE_DEMO_KEYS } from "#src/demos/free/setup-guide/setup-guide-demo-keys.constant";

/** The demo's keys. */
const K = SETUP_GUIDE_DEMO_KEYS.demo_free.setup_guide;

/** The tasks, by key. */
const TASKS = ["menu", "printer", "staff"] as const;

/** Store setup. */
export default function StoreSetup() {
  const t = useCatalogueText(MESSAGES.en);
  const [done, setDone] = useState<readonly string[]>(["printer"]);
  return (
    <SetupGuide
      title={t(K.title)}
      description={t(K.description)}
      tasks={TASKS.map((id) => ({
        id,
        title: t(K[id]),
        isComplete: done.includes(id),
        ...(id === "menu"
          ? { actionLabel: t(K.menu_action), onAction: () => setDone((ids) => [...ids, "menu"]) }
          : {}),
      }))}
      onCompleteChange={(id, isComplete) =>
        setDone((ids) => (isComplete ? [...ids, id] : ids.filter((other) => other !== id)))
      }
    />
  );
}
