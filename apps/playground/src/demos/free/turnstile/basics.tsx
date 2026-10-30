/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Turnstile: a reset form with Cloudflare's always-passing test key; sending reads the
 *          token the widget put in the form.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Button, Text, TextField, Turnstile, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TURNSTILE_KEYS } from "#src/demos/free/turnstile/turnstile-keys.constant";

/** The demo's keys. */
const K = TURNSTILE_KEYS.turnstile;

/** Cloudflare's public test site key that always passes; a real form uses the app's own key. */
const PASSING_TEST_KEY = "1x00000000000000000000AA";

/** Turnstile: In a form. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [length, setLength] = useState<number | undefined>(undefined);
  return (
    <form
      className="grid max-w-sm gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const token = new FormData(event.currentTarget).get("captchaToken");
        setLength(typeof token === "string" ? token.length : 0);
      }}
    >
      <TextField name="email" type="email" label={t(K.email)} />
      <Turnstile name="captchaToken" siteKey={PASSING_TEST_KEY} />
      <Text type="small" tone="muted">
        {t(K.test_key)}
      </Text>
      <div>
        <Button type="submit">{t(K.send)}</Button>
      </div>
      <Text type="small" tone="muted" aria-live="polite">
        {length === undefined ? t(K.not_sent) : t(K.sent, { length })}
      </Text>
    </form>
  );
}
