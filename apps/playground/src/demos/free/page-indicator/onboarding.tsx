/**
 * Stackra file contract:
 * Purpose: the "onboarding" demo of the web PageIndicator: four onboarding steps of a shop app, the dots pressable
 *          and named "Step 2 of 4", with Back and Next buttons beside them.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Button, Card, Heading, PageIndicator, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { PAGE_INDICATOR_KEYS } from "#src/demos/free/page-indicator/page-indicator-keys.constant";

/** The demo's keys. */
const K = PAGE_INDICATOR_KEYS.page_indicator.onboarding;

/** The steps: title and line. */
const STEPS = [
  [K.title_1, K.body_1],
  [K.title_2, K.body_2],
  [K.title_3, K.body_3],
  [K.title_4, K.body_4],
] as const;

/** PageIndicator: onboarding steps. */
export default function Onboarding() {
  const t = useCatalogueText(MESSAGES.en);
  const [step, setStep] = useState(0);
  const [title, body] = STEPS[step] ?? STEPS[0];
  const isLast = step === STEPS.length - 1;
  return (
    <Card className="grid w-full max-w-sm gap-4 p-5">
      <div className="grid min-h-20 gap-1">
        <Heading level={3}>{t(title)}</Heading>
        <Text tone="muted">{t(body)}</Text>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" isDisabled={step === 0} onPress={() => setStep(step - 1)}>
          {t(K.back)}
        </Button>
        <PageIndicator
          count={STEPS.length}
          index={step}
          onChange={setStep}
          label={t(K.label)}
          getPageLabel={(page, count) => t(K.step, { page, count })}
        />
        <Button size="sm" onPress={() => setStep(isLast ? 0 : step + 1)}>
          {t(isLast ? K.done : K.next)}
        </Button>
      </div>
    </Card>
  );
}
