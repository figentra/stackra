/**
 * Stackra file contract:
 * Purpose: the "autosave" demo of the native SaveStatus: an order note saves itself a moment after each change; one button makes the next save fail.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { SaveState } from "@stackra/ui/contracts";
import { Button, SaveStatus, TextArea, useCatalogueText } from "@stackra/ui/native";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SAVE_BAR_DEMO_KEYS } from "#src/demos/free/save-bar/save-bar-demo-keys.constant";

/** The demo's keys. */
const K = SAVE_BAR_DEMO_KEYS.demo_free.save_bar;

/** How long typing must pause before a save starts, and how long the save takes. */
const DEBOUNCE = 600;
const DELAY = 700;

/** Autosave with its status. */
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
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- each edit of the note is the trigger of the pretend autosave this demo shows
  }, [note]);

  return (
    <View className="gap-3">
      <TextArea label={t(K.note)} value={note} onChange={setNote} />
      <SaveStatus state={state} />
      <View className="flex-row">
        <Button
          size="sm"
          variant="secondary"
          onPress={() => {
            failsNext.current = true;
          }}
        >
          {t(K.fail_next)}
        </Button>
      </View>
    </View>
  );
}
