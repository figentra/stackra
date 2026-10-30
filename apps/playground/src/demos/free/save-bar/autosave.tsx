/**
 * Stackra file contract:
 * Purpose: the "autosave" demo of the web SaveStatus: an order note saves itself a moment after each change, announcing saving, saved or failed; one button makes the next save fail.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL); design-system gap inventory row 8.
 */
import type { SaveState } from "@stackra/ui/contracts";
import { Button, SaveStatus, TextArea, useCatalogueText } from "@stackra/ui/react";
import { useEffect, useRef, useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SAVE_BAR_KEYS } from "#src/demos/free/save-bar/save-bar-keys.constant";

/** The demo's keys. */
const K = SAVE_BAR_KEYS.save_bar;

/** How long typing must pause before a save starts, and how long the save takes. */
const DEBOUNCE = 600;
const DELAY = 700;

/** SaveStatus: Autosave. */
export default function Autosave() {
  const t = useCatalogueText(MESSAGES.en);
  const [note, setNote] = useState("");
  const [state, setState] = useState<SaveState>("idle");
  // Read when a save lands, so pressing the button never starts a save of its own.
  const failsNext = useRef(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const start = setTimeout(() => setState("saving"), DEBOUNCE);
    const finish = setTimeout(() => {
      setState(failsNext.current ? "failed" : "saved");
      failsNext.current = false;
    }, DEBOUNCE + DELAY);
    return () => {
      clearTimeout(start);
      clearTimeout(finish);
    };
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- the note is the trigger of the pretend autosave this demo shows
  }, [note]);

  return (
    <div className="grid gap-3">
      <TextArea label={t(K.note)} value={note} onChange={setNote} rows={3} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SaveStatus state={state} />
        <Button
          size="sm"
          variant="secondary"
          onPress={() => {
            failsNext.current = true;
          }}
        >
          {t(K.fail_next)}
        </Button>
      </div>
    </div>
  );
}
