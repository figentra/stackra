/**
 * Stackra file contract:
 * Purpose: the web `QuestionnaireCard`: an assistant's questions in a card, one per step, answered with radios, check
 *          boxes (each with an optional "Other" and its own text field) or free text, with "Question 2 of 4" and a bar,
 *          Back, Skip and Next; after the last, a summary of the answers with Edit on each, and Send.
 * Boundary: the behaviour is `useQuestionnaire`; this draws it with the house Card, ProgressBar, RadioGroup,
 *           CheckboxGroup, TextArea, TextField, Chip and Button. The card is a region named by its title. On each step
 *           change focus moves to the new question's heading (or the summary's) and a polite status region says where
 *           the person is; Skip shows only on a question that is not required, and Next waits for a required answer.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.3.1, 2.4.3, 3.3.2, 4.1.3; STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import { useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from "react";
import { VisuallyHidden } from "react-aria-components";

import type { QuestionnaireQuestion } from "#contracts/types/questionnaire-question.type";
import { AI_ASSIST_KEYS } from "#core/constants/ai-assist-keys.constant";
import { QUESTIONNAIRE_OTHER_VALUE } from "#core/constants/questionnaire-other-value.constant";
import { AiMark } from "#react/ai-mark/ai-mark";
import { Button } from "#react/button/button";
import { Card } from "#react/card/card";
import { CheckboxGroup } from "#react/checkbox-group/checkbox-group";
import { Chip } from "#react/chip/chip";
import { useQuestionnaire } from "#react/hooks/use-questionnaire";
import { useUiText } from "#react/hooks/use-ui-text";
import { ProgressBar } from "#react/progress-bar/progress-bar";
import type { QuestionnaireCardProps } from "#react/questionnaire-card/questionnaire-card.props";
import { RadioGroup } from "#react/radio-group/radio-group";
import { Text } from "#react/text/text";
import { TextArea } from "#react/text-area/text-area";
import { TextField } from "#react/text-field/text-field";

const K = AI_ASSIST_KEYS.ui.questionnaire_card;

/** An answer's value as shown: its option's label, or the typed text. */
const shownOf = (question: QuestionnaireQuestion, value: string): ReactNode =>
  question.options?.find((option) => option.value === value)?.label ?? value;

/** An assistant's questions, one at a time, then a summary to send. */
export function QuestionnaireCard({
  title,
  description,
  questions,
  defaultAnswers,
  onSubmit,
  submitLabel,
  isSubmitting = false,
  className,
}: QuestionnaireCardProps): ReactElement {
  const t = useUiText();
  const id = useId();
  const q = useQuestionnaire(questions, defaultAnswers);
  const body = useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = useState("");
  const moved = useRef(false);
  const progress = q.isSummary
    ? t(K.summary)
    : t(K.progress, { current: q.step + 1, total: q.total });

  // After a move (never on the first draw) the new step's heading takes focus and the step is said.
  useEffect(() => {
    if (!moved.current) return;
    body.current?.querySelector<HTMLElement>("h3")?.focus();
    setAnnouncement(progress);
  }, [progress]);
  const move = (action: () => void) => {
    moved.current = true;
    action();
  };

  const question = q.question;
  const headingId = `${id}-question`;
  const options = question
    ? [
        ...(question.options ?? []),
        ...(question.allowsOther ? [{ value: QUESTIONNAIRE_OTHER_VALUE, label: t(K.other) }] : []),
      ]
    : [];

  return (
    <Card
      {...(className === undefined ? {} : { className })}
      role="region"
      aria-labelledby={`${id}-title`}
    >
      <Card.Header className="grid gap-1">
        <AiMark kind="generated" label={t(K.from_assistant)} isLabelVisible />
        <Card.Title id={`${id}-title`} level={2}>
          {title}
        </Card.Title>
        {description ? <Card.Description>{description}</Card.Description> : null}
      </Card.Header>
      <Card.Content className="grid gap-4">
        {question ? (
          <ProgressBar
            value={q.step + 1}
            maxValue={Math.max(q.total, 1)}
            size="sm"
            label={progress}
            valueLabel={progress}
            isLabelVisible
          />
        ) : null}
        <div ref={body} className="grid gap-3">
          {question ? (
            <>
              <div className="grid gap-1">
                <Card.Title
                  level={3}
                  id={headingId}
                  tabIndex={-1}
                  className="text-base outline-none"
                >
                  {question.title}
                </Card.Title>
                {question.description ? <Text tone="muted">{question.description}</Text> : null}
              </div>
              {question.kind === "text" ? (
                <TextArea
                  aria-labelledby={headingId}
                  value={q.draft.values[0] ?? ""}
                  onChange={q.setText}
                  placeholder={question.placeholder}
                  rows={3}
                />
              ) : question.kind === "single" ? (
                <RadioGroup
                  aria-labelledby={headingId}
                  options={options}
                  value={q.choice as string}
                  onChange={q.setChoice}
                />
              ) : (
                <CheckboxGroup
                  aria-labelledby={headingId}
                  options={options}
                  value={q.choice as readonly string[]}
                  onChange={q.setChoice}
                />
              )}
              {q.draft.other !== null && question.kind !== "text" ? (
                <TextField label={t(K.other_label)} value={q.draft.other} onChange={q.setOther} />
              ) : null}
            </>
          ) : (
            <>
              <Card.Title level={3} tabIndex={-1} className="text-base outline-none">
                {t(K.summary)}
              </Card.Title>
              <dl className="grid gap-3">
                {questions.map((item, index) => {
                  const answer = q.answerOf(item);
                  const values =
                    answer === undefined ? [] : typeof answer === "string" ? [answer] : answer;
                  return (
                    <div key={item.id} className="flex items-start justify-between gap-3">
                      <div className="grid min-w-0 gap-1">
                        <dt className="text-sm text-muted">{item.title}</dt>
                        <dd className="flex flex-wrap gap-1">
                          {values.length === 0 ? (
                            <Text type="small" tone="muted">
                              {t(K.skipped)}
                            </Text>
                          ) : item.kind === "text" ? (
                            <Text>{values[0]}</Text>
                          ) : (
                            values.map((value) => (
                              <Chip key={value} size="sm" variant="secondary">
                                {shownOf(item, value)}
                              </Chip>
                            ))
                          )}
                        </dd>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        startIcon="pencil"
                        label={t(K.edit_answer, { question: item.title })}
                        onPress={() => move(() => q.edit(index))}
                      >
                        {t(K.edit)}
                      </Button>
                    </div>
                  );
                })}
              </dl>
            </>
          )}
        </div>
      </Card.Content>
      <Card.Footer className="flex flex-wrap items-center gap-2">
        {q.step > 0 ? (
          <Button variant="ghost" startIcon="chevron-left" onPress={() => move(q.back)}>
            {t(K.back)}
          </Button>
        ) : null}
        <span className="flex-1" />
        {question && !question.isRequired ? (
          <Button variant="ghost" onPress={() => move(q.skip)}>
            {t(K.skip)}
          </Button>
        ) : null}
        {question ? (
          <Button
            isDisabled={question.isRequired === true && !q.hasAnswer}
            onPress={() => move(q.next)}
          >
            {q.isLast ? t(K.review) : t(K.next)}
          </Button>
        ) : (
          <Button isLoading={isSubmitting} onPress={() => onSubmit(q.answers())}>
            {submitLabel ?? t(K.submit)}
          </Button>
        )}
      </Card.Footer>
      <VisuallyHidden role="status">{announcement}</VisuallyHidden>
    </Card>
  );
}
