/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web ColorField: an uncontrolled brand colour with help text, and a controlled
 *          invoice accent whose saved hex code is read back as it changes.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0055 (one field contract); ADR 0060 (light, dark, RTL); STA-1981.
 */
import { ColorField, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { COLOR_FIELD_KEYS } from "#src/demos/free/color-field/color-field-keys.constant";

/** The demo's keys. */
const K = COLOR_FIELD_KEYS.color_field.basics;

/** Colour field: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  // A hex code is data, never translated.
  const [accent, setAccent] = useState("#1f7a4d");
  return (
    <div className="grid w-72 gap-6">
      <ColorField
        label={t(K.brand_label)}
        description={t(K.brand_hint)}
        defaultValue="#0485f7"
        placeholder="#000000"
        isFullWidth
      />
      <div className="grid gap-2">
        <ColorField
          label={t(K.accent_label)}
          value={accent}
          onChange={setAccent}
          placeholder="#000000"
          isFullWidth
        />
        <Text type="small" tone="muted" role="status">
          {t(K.value, { value: accent === "" ? t(K.cleared) : accent })}
        </Text>
      </div>
    </div>
  );
}
