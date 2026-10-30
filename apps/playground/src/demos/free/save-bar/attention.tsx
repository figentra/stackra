/**
 * Stackra file contract:
 * Purpose: the "attention" demo of the web SaveBar: with unsaved changes, trying to leave is blocked and the bar shakes (a new `attentionKey`), as LeaveConfirmation would ask an app to do.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL); design-system gap inventory row 8.
 */
import { Button, SaveBar as UiSaveBar, Text, TextField, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SAVE_BAR_KEYS } from "#src/demos/free/save-bar/save-bar-keys.constant";

/** The demo's keys. */
const K = SAVE_BAR_KEYS.save_bar;

/** SaveBar: Blocked navigation. */
export default function Attention() {
  const t = useCatalogueText(MESSAGES.en);
  const [saved, setSaved] = useState(() => t(K.sample_product));
  const [name, setName] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [hasLeft, setHasLeft] = useState(false);
  const isDirty = name !== "" && name !== saved;

  const leave = () => {
    if (isDirty) setAttempts((count) => count + 1);
    else setHasLeft(true);
  };

  return (
    <div className="grid gap-4">
      <TextField label={t(K.product_name)} value={name} placeholder={saved} onChange={setName} />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onPress={leave}>
          {t(K.leave)}
        </Button>
        <Text type="small" tone="muted" aria-live="polite">
          {isDirty && attempts > 0 ? t(K.blocked) : hasLeft ? t(K.left) : ""}
        </Text>
      </div>
      <UiSaveBar
        isDirty={isDirty}
        attentionKey={attempts}
        onDiscard={() => setName("")}
        onSave={() => {
          setSaved(name);
          setName("");
        }}
      />
    </div>
  );
}
