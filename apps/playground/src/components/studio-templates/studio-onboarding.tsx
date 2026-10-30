/**
 * Stackra file contract:
 * Purpose: the Theme Studio's "Onboarding" template: a set-up flow's steps, a card asking for a workspace's name,
 *          address and team size, the terms, the progress and the back and continue actions.
 * Boundary: a canvas template with no props; the theme is the canvas's. The stepper moves; nothing is saved.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio).
 */
import {
  Button,
  Card,
  Checkbox,
  Heading,
  Icon,
  ProgressBar,
  RadioGroup,
  Text,
  TextField,
  useCatalogueText,
} from "@stackra/ui/react";
import { useState } from "react";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { THEME_STUDIO_KEYS } from "#src/routes/theme-studio/theme-studio-keys.constant";

import { STUDIO_DISPLAY } from "./studio-display.constant";

/** The template's keys. */
const K = THEME_STUDIO_KEYS.theme_studio.onboarding;

const STEPS = ["account", "workspace", "team"] as const;

/** The onboarding template. */
export function StudioOnboarding() {
  const t = useCatalogueText(MESSAGES.en);
  const [step, setStep] = useState(1);
  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6 py-4">
      <ol aria-label={t(K.steps_label)} className="flex items-center gap-3">
        {STEPS.map((id, index) => (
          <li
            key={id}
            aria-current={index === step ? "step" : undefined}
            className={`flex min-w-0 items-center gap-3 ${index < STEPS.length - 1 ? "flex-1" : ""}`}
          >
            <span
              className={`grid size-8 shrink-0 place-items-center text-sm font-semibold ${index <= step ? "bg-accent text-accent-foreground" : "bg-default text-muted"}`}
              style={{ borderRadius: "var(--radius-full)" }}
            >
              {index < step ? <Icon name={Icons.Check} size="sm" /> : index + 1}
            </span>
            {/* A phone-wide sheet names the current step only; the others keep their names for assistive technology. */}
            <span
              className={`text-sm ${index === step ? "font-semibold" : "text-muted sr-only @md:not-sr-only"}`}
            >
              {t(K.steps[id])}
            </span>
            {index < STEPS.length - 1 ? (
              <span aria-hidden="true" className="h-px min-w-4 flex-1 bg-separator" />
            ) : null}
          </li>
        ))}
      </ol>
      <Card>
        <Card.Header className="gap-1">
          <Heading level={2} className={`[font:var(--h3)] ${STUDIO_DISPLAY}`}>
            {t(K.title)}
          </Heading>
          <Text tone="muted">
            <bdi>{t(K.subtitle)}</bdi>
          </Text>
        </Card.Header>
        <Card.Content className="grid gap-5">
          <TextField label={t(K.workspace)} defaultValue={t(K.workspace_value)} />
          <TextField
            label={t(K.address)}
            description={<bdi dir="ltr">{t(K.address_note)}</bdi>}
            defaultValue="atlas"
          />
          <RadioGroup
            label={t(K.size)}
            options={(["solo", "small", "medium", "large"] as const).map((value) => ({
              value,
              label: t(K.sizes[value]),
            }))}
            defaultValue="small"
          />
          <Checkbox label={t(K.terms)} defaultValue />
          <ProgressBar label={t(K.progress)} value={((step + 1) / STEPS.length) * 100} />
        </Card.Content>
        <Card.Footer className="justify-between gap-2">
          <Button
            variant="ghost"
            startIcon={<Icon name={Icons.ArrowLeft} isMirroredInRtl />}
            isDisabled={step === 0}
            onPress={() => setStep(step - 1)}
          >
            {t(K.back)}
          </Button>
          <Button isDisabled={step === STEPS.length - 1} onPress={() => setStep(step + 1)}>
            {t(K.continue)}
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
}
