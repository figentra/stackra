/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Text field: An email field that is invalid until it has an at sign, with the
 *          text typed so far shown beneath it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import { Text, TextField as UiTextField, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TEXT_FIELD_KEYS } from "#src/demos/free/text-field/text-field-keys.constant";

/** The demo's keys. */
const K = TEXT_FIELD_KEYS.text_field;

/** Text field: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [email, setEmail] = useState("");

  const isInvalid = email.length > 0 && !email.includes("@");

  return (
    <div className="grid gap-6">
      <UiTextField
        label={t(K.live_label)}
        description={t(K.live_description)}
        errorMessage={t(K.live_error)}
        type="email"
        isInvalid={isInvalid}
        value={email}
        onChange={setEmail}
      />
      <Text data-testid="typed" aria-live="polite">
        {email === "" ? t(K.live_empty) : t(K.live_typed, { count: email.length, text: email })}
      </Text>
    </div>
  );
}
