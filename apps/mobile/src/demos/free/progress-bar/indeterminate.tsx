/**
 * Stackra file contract:
 * Purpose: the "indeterminate" demo of the native ProgressBar: without a `value` the end is unknown.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { ProgressBar, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PROGRESS_BAR_DEMO_KEYS } from "#src/demos/free/progress-bar/progress-bar-demo-keys.constant";

/** The demo's keys. */
const K = PROGRESS_BAR_DEMO_KEYS.demo_free.progress_bar.indeterminate;

/** Work under way. */
export default function Indeterminate() {
  const t = useCatalogueText(MESSAGES.en);
  return <ProgressBar label={t(K.label)} isLabelVisible />;
}
