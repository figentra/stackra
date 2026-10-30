/**
 * Stackra file contract:
 * Purpose: the "product-form" demo of the native SaveBar: editing a menu item's name slides the bar up; Save is busy for a moment, Discard restores the name.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { SaveBar, TextField, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SAVE_BAR_DEMO_KEYS } from "#src/demos/free/save-bar/save-bar-demo-keys.constant";

/** The demo's keys. */
const K = SAVE_BAR_DEMO_KEYS.demo_free.save_bar;

/** How long the fake save takes, so the busy state can be seen. */
const DELAY = 800;

/** A dirty product form. */
export default function ProductForm() {
  const t = useCatalogueText(MESSAGES.en);
  const [saved, setSaved] = useState(() => t(K.sample_product));
  const [name, setName] = useState(saved);
  return (
    <View className="gap-4">
      <TextField label={t(K.product_name)} value={name} onChange={setName} />
      <SaveBar
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
    </View>
  );
}
