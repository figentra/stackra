/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native Form: an email checked on send, optional notes, and the last attempt.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Form, Text, TextArea, TextField, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { FORM_DEMO_KEYS } from "#src/demos/free/form/form-demo-keys.constant";

/** The demo's keys. */
const K = FORM_DEMO_KEYS.demo_free.form.live;

/** An address with something on both sides of one at sign and a dot after it: enough for a demo. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Send checks the email; the readout says what happened. */
export default function Live() {
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const [sent, setSent] = useState(0);
  const [isRefused, setIsRefused] = useState(false);
  const t = useCatalogueText(MESSAGES.en);

  const submit = () => {
    const isValid = EMAIL.test(email);
    setIsInvalid(!isValid);
    setIsRefused(!isValid);
    if (isValid) setSent(sent + 1);
  };

  return (
    <Form style={{ gap: 16 }}>
      <TextField
        label={t(K.email)}
        description={t(K.email_hint)}
        errorMessage={t(K.email_error)}
        type="email"
        isRequired
        isInvalid={isInvalid}
        value={email}
        onChange={setEmail}
      />
      <TextArea
        label={t(K.notes)}
        description={t(K.notes_hint)}
        rows={3}
        value={notes}
        onChange={setNotes}
      />
      <Button onPress={submit}>{t(K.submit)}</Button>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {isRefused ? t(K.refused) : sent === 0 ? t(K.not_sent) : t(K.sent, { count: sent, email })}
      </Text>
    </Form>
  );
}
