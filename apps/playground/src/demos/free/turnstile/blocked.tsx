/**
 * Stackra file contract:
 * Purpose: the "blocked" demo of the web Turnstile: Cloudflare's always-refusing test key: the widget fails, `onError`
 *          says so with Cloudflare's code, and the form gets no token, so the server would refuse the post.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Text, Turnstile, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TURNSTILE_KEYS } from "#src/demos/free/turnstile/turnstile-keys.constant";

/** The demo's keys. */
const K = TURNSTILE_KEYS.turnstile;

/** Cloudflare's public test site key that always refuses the visitor. */
const REFUSING_TEST_KEY = "2x00000000000000000000AB";

/** Turnstile: A refused visitor. */
export default function Blocked() {
  const t = useCatalogueText(MESSAGES.en);
  const [code, setCode] = useState<string | undefined>(undefined);
  return (
    <div className="grid max-w-sm gap-3">
      <Turnstile siteKey={REFUSING_TEST_KEY} onError={setCode} />
      <Text type="small" tone="muted">
        {t(K.blocked_key)}
      </Text>
      <Text type="small" aria-live="polite">
        {code === undefined ? t(K.waiting) : t(K.refused, { code })}
      </Text>
    </div>
  );
}
