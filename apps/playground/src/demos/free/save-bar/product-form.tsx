/**
 * Stackra file contract:
 * Purpose: the "product-form" demo of the web SaveBar: editing a menu item's name makes the form dirty; Save keeps the bar busy for a moment, Discard restores the saved name.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL); design-system gap inventory row 8.
 */
import { SaveBar as UiSaveBar, TextField, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SAVE_BAR_KEYS } from "#src/demos/free/save-bar/save-bar-keys.constant";

/** The demo's keys. */
const K = SAVE_BAR_KEYS.save_bar;

/** How long the fake save takes, so the busy state can be seen. */
const DELAY = 800;

/** SaveBar: A dirty product form. */
export default function ProductForm() {
  const t = useCatalogueText(MESSAGES.en);
  const [saved, setSaved] = useState(() => t(K.sample_product));
  const [name, setName] = useState(saved);
  return (
    <div className="grid gap-4">
      <TextField label={t(K.product_name)} value={name} onChange={setName} />
      <UiSaveBar
        isDirty={name !== saved}
        message={t(K.message)}
        onDiscard={() => setName(saved)}
        onSave={() =>
          new Promise<void>((resolve) => {
            setTimeout(() => {
              setSaved(name);
              resolve();
            }, DELAY);
          })
        }
      />
    </div>
  );
}
