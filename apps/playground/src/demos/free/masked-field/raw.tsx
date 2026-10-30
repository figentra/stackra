/**
 * Stackra file contract:
 * Purpose: the "raw" demo of the web MaskedField: a controlled commercial-registration number; the line under it shows the raw digits the field holds, without the separators.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave C, owner request 2026-10-29).
 */
import { MaskedField, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { MASKED_FIELD_KEYS } from "#src/demos/free/masked-field/masked-field-keys.constant";

/** The demo's keys. */
const K = MASKED_FIELD_KEYS.masked_field.raw;

/** MaskedField: the raw value beside the masked one. */
export default function Raw() {
  const t = useCatalogueText(MESSAGES.en);
  const [value, setValue] = useState("1010123456");
  return (
    <div className="grid w-full max-w-sm gap-2">
      <MaskedField
        label={t(K.label)}
        description={t(K.description)}
        mask="9999-999-999"
        value={value}
        onChange={setValue}
      />
      <Text tone="muted" aria-live="polite">
        {t(K.held, { value })}
      </Text>
    </div>
  );
}
