/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Press feedback: the same tile with each answer to a press.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL).
 */
import type { PressFeedbackKind } from "@stackra/ui/contracts";
import { Card, PressFeedback, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { PRESS_FEEDBACK_KEYS } from "#src/demos/free/press-feedback/press-feedback-keys.constant";

/** The demo's keys. */
const K = PRESS_FEEDBACK_KEYS.press_feedback;

const KINDS: readonly PressFeedbackKind[] = ["scale", "highlight", "ripple"];

/** Press feedback: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [count, setCount] = useState(0);
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-3">
        {KINDS.map((kind) => (
          <PressFeedback
            key={kind}
            feedback={kind}
            onPress={() => setCount((value) => value + 1)}
            className="rounded-[var(--radius-container)]"
          >
            <Card className="w-40 gap-1 p-4">
              <Text type="caption" tone="muted">
                {t(K[kind])}
              </Text>
              <Text className="font-semibold">{t(K.sales)}</Text>
              <Text>{t(K.value)}</Text>
            </Card>
          </PressFeedback>
        ))}
      </div>
      <Text type="small" tone="muted" aria-live="polite">
        {t(K.pressed, { count })}
      </Text>
    </div>
  );
}
