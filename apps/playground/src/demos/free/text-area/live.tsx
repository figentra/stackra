/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Text area: A message of at most 40 characters: the count follows the text and
 *          the area turns invalid past it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import { Text, TextArea as UiTextArea, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TEXT_AREA_KEYS } from "#src/demos/free/text-area/text-area-keys.constant";

/** The demo's keys. */
const K = TEXT_AREA_KEYS.text_area;

/** The longest message the live sample accepts. */
const LIMIT = 40;

/** Text area: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [message, setMessage] = useState("");

  return (
    <div className="grid gap-6">
      <UiTextArea
        label={t(K.live_label)}
        description={t(K.live_description)}
        errorMessage={t(K.live_error)}
        rows={3}
        isInvalid={message.length > LIMIT}
        value={message}
        onChange={setMessage}
      />
      <Text data-testid="count" aria-live="polite">
        {t(K.live_count, { count: message.length })}
      </Text>
    </div>
  );
}
