/**
 * Stackra file contract:
 * Purpose: `OnboardingChecklist`, the console's onboarding checklist: a card with the progress (done of total, as a
 *          labelled bar), each visible step with its translated label and help, a done mark, the button that opens its
 *          screen, a mark-as-done button, and, for a viewer who may customise it, hide and move buttons on unlocked
 *          steps; a locked step says it is required.
 * Boundary: web; shows and reports only. Which steps exist, which are locked and their order are the template's and
 *           the scope's customisation (seed data), and progress is stored by the workflow service; nothing here names
 *           a step. A locked step never offers hide or move (RV-22).
 * Runtime: browser
 * Governing contract: ADR 0424 (decisions 1 and 2); owner RV-22; WCAG 2.2 SC 1.4.1 and 4.1.2.
 */
import type { I18nKey } from "@stackra/i18n";
import { useTranslation } from "@stackra/i18n/react";
import { Button, Card, Icon, IconButton, ProgressBar, Text } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import type { OnboardingChecklistProps } from "#react/onboarding-checklist/onboarding-checklist.props";

/**
 * The onboarding checklist.
 *
 * @example
 * <OnboardingChecklist view={checklistView(template, customization, progress)} onOpen={go} onComplete={complete} />
 */
export function OnboardingChecklist({
  view,
  onOpen,
  onComplete,
  onHide,
  onMove,
}: OnboardingChecklistProps): ReactElement {
  const { t } = useTranslation();
  const keys = PANEL_KEYS.panel.checklist;
  const total = view.steps.length;
  const progress = view.complete ? t(keys.complete) : t(keys.progress, { done: view.done, total });
  return (
    <Card data-checklist={view.key}>
      <Card.Header>
        <Card.Title level={2}>{t(keys.title)}</Card.Title>
        <Card.Description>{progress}</Card.Description>
      </Card.Header>
      <Card.Content>
        <ProgressBar
          label={t(keys.title)}
          valueLabel={progress}
          value={view.done}
          maxValue={Math.max(total, 1)}
          tone={view.complete ? "success" : "accent"}
        />
        <ol className="mt-3 flex flex-col divide-y divide-separator">
          {view.steps.map((step, index) => {
            // The steps come from the template's data at runtime, so their lang keys arrive as strings.
            const label = t(step.label as I18nKey);
            const canCustomise = !step.locked;
            return (
              <li key={step.key} data-step={step.key} className="flex items-center gap-3 py-3">
                <Icon
                  name={step.done ? "circle-check" : "circle"}
                  tone={step.done ? "success" : "default"}
                  label={step.done ? t(keys.done) : undefined}
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <Text className={step.done ? "text-muted line-through" : "font-medium"}>
                    {label}
                  </Text>
                  {step.description === undefined ? null : (
                    <Text type="small" tone="muted">
                      {t(step.description as I18nKey)}
                    </Text>
                  )}
                  {step.locked ? (
                    <Text type="small" tone="muted">
                      {t(keys.locked)}
                    </Text>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  {step.route === undefined || onOpen === undefined ? null : (
                    <Button size="sm" variant="secondary" onPress={() => onOpen(step.route ?? "")}>
                      {t(keys.open)}
                    </Button>
                  )}
                  {step.done || onComplete === undefined ? null : (
                    <Button size="sm" variant="ghost" onPress={() => onComplete(step.key)}>
                      {t(keys.mark_done)}
                    </Button>
                  )}
                  {canCustomise && onMove !== undefined ? (
                    <>
                      <IconButton
                        icon="arrow-up"
                        size="sm"
                        variant="ghost"
                        label={t(keys.move_up, { label })}
                        isDisabled={index === 0}
                        onPress={() => onMove(step.key, -1)}
                      />
                      <IconButton
                        icon="arrow-down"
                        size="sm"
                        variant="ghost"
                        label={t(keys.move_down, { label })}
                        isDisabled={index === total - 1}
                        onPress={() => onMove(step.key, 1)}
                      />
                    </>
                  ) : null}
                  {canCustomise && onHide !== undefined ? (
                    <IconButton
                      icon="eye-off"
                      size="sm"
                      variant="ghost"
                      label={t(keys.hide, { label })}
                      onPress={() => onHide(step.key)}
                    />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </Card.Content>
    </Card>
  );
}
