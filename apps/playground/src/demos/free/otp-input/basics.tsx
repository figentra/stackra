/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web OTP input: Basics.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { OtpInput, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { OTP_INPUT_KEYS } from "#src/demos/free/otp-input/otp-input-keys.constant";

/** The demo's keys. */
const K = OTP_INPUT_KEYS.otp_input.basics;

/** OTP input: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [code, setCode] = useState<string | null>(null);
  return (
    <div className="grid gap-4">
      <OtpInput label={t(K.label)} description={t(K.hint)} onComplete={setCode} />
      <Text tone="muted">{code ? t(K.done, { code }) : t(K.waiting)}</Text>
    </div>
  );
}
