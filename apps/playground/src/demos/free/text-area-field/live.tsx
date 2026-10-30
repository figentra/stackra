/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Text area field: a message of at most 60 characters: the count follows the text and
 *          the field turns invalid past it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Text, TextAreaField, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TEXT_AREA_FIELD_KEYS } from "#src/demos/free/text-area-field/text-area-field-keys.constant";

/** The demo's keys. */
const K = TEXT_AREA_FIELD_KEYS.text_area_field;

/** The longest message the sample accepts. */
const LIMIT = 60;

/** Text area field: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [message, setMessage] = useState("");
  return (
    <div className="grid gap-3">
      <TextAreaField
        name="message"
        label={t(K.live_label)}
        description={t(K.live_description)}
        errorMessage={t(K.live_error)}
        isInvalid={message.length > LIMIT}
        rows={3}
        value={message}
        onChange={setMessage}
      />
      <Text type="small" tone="muted" aria-live="polite">
        {t(K.live_count, { count: message.length })}
      </Text>
    </div>
  );
}
