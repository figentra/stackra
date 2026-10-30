/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Progress button: an upload that fills the button, then reports it is done.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL).
 */
import { ProgressButton, useCatalogueText } from "@stackra/ui/react";
import { useEffect, useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { PROGRESS_BUTTON_KEYS } from "#src/demos/free/progress-button/progress-button-keys.constant";

/** The demo's keys. */
const K = PROGRESS_BUTTON_KEYS.progress_button;

/** Progress button: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [progress, setProgress] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (progress === undefined || progress >= 1) return undefined;
    const timer = setTimeout(() => setProgress(Math.min(progress + 0.1, 1)), 250);
    return () => clearTimeout(timer);
  }, [progress]);
  const isDone = progress !== undefined && progress >= 1;
  return (
    <ProgressButton
      progress={progress}
      progressLabel={t(K.uploading)}
      startIcon={isDone ? "check" : "upload"}
      onPress={() => setProgress(0)}
    >
      {isDone ? t(K.uploaded) : progress === undefined ? t(K.upload) : t(K.uploading)}
    </ProgressButton>
  );
}
