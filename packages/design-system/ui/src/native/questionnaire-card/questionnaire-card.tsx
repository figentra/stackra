/**
 * Stackra file contract:
 * Purpose: the native `QuestionnaireCard`: an assistant's questions in a card, one per step, answered with radios, check
 *          boxes (each with an optional "Other" and its own text field) or free text, with "Question 2 of 4" and a bar,
 *          Back, Skip and Next; after the last, a summary of the answers with Edit on each, and Send.
 * Boundary: the behaviour is `useQuestionnaire`; this draws it with the house Card, ProgressBar, RadioGroup,
 *           CheckboxGroup, TextArea, TextField, Chip and Button. Each step change is announced ("Question 2 of 4: …")
 *           through `announceForAccessibility`; focus is not moved (React Native has no portable way to move it to a
 *           heading). Skip shows only on a question that is not required, and Next waits for a required answer.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.3.1, 3.3.2, 4.1.3; STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import { useEffect, useRef, type ReactElement, type ReactNode } from "react";
import { AccessibilityInfo, View } from "react-native";

import type { QuestionnaireQuestion } from "#contracts/types/questionnaire-question.type";
import { AI_ASSIST_KEYS } from "#core/constants/ai-assist-keys.constant";
import { QUESTIONNAIRE_OTHER_VALUE } from "#core/constants/questionnaire-other-value.constant";
import { useQuestionnaire } from "#react/hooks/use-questionnaire";
import { useUiText } from "#react/hooks/use-ui-text";
import { AiMark } from "#native/ai-mark/ai-mark";
import { Button } from "#native/button/button";
import { Card } from "#native/card/card";
import { CheckboxGroup } from "#native/checkbox-group/checkbox-group";
import { Chip } from "#native/chip/chip";
import { ProgressBar } from "#native/progress-bar/progress-bar";
import type { QuestionnaireCardProps } from "#native/questionnaire-card/questionnaire-card.props";
import { RadioGroup } from "#native/radio-group/radio-group";
import { Text } from "#native/text/text";
import { TextArea } from "#native/text-area/text-area";
import { TextField } from "#native/text-field/text-field";

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
  const q = useQuestionnaire(questions, defaultAnswers);
  const question = q.question;
  const progress = q.isSummary
    ? t(K.summary)
    : t(K.progress, { current: q.step + 1, total: q.total });
  const spoken = question ? `${progress}: ${question.title}` : progress;

  // Each step after the first is said, with its question.
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    AccessibilityInfo.announceForAccessibility(spoken);
  }, [spoken]);

  const options = question
    ? [
        ...(question.options ?? []),
        ...(question.allowsOther ? [{ value: QUESTIONNAIRE_OTHER_VALUE, label: t(K.other) }] : []),
      ]
    : [];

  return (
    <Card {...(className === undefined ? {} : { className })}>
      <Card.Header className="gap-1">
        <AiMark kind="generated" label={t(K.from_assistant)} isLabelVisible />
        <Card.Title level={2}>{title}</Card.Title>
        {description ? <Card.Description>{description}</Card.Description> : null}
      </Card.Header>
      <Card.Content className="gap-4">
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
        {question ? (
          <View className="gap-3">
            <View className="gap-1">
              <Card.Title level={3} className="text-base">
                {question.title}
              </Card.Title>
              {question.description ? <Text tone="muted">{question.description}</Text> : null}
            </View>
            {question.kind === "text" ? (
              <TextArea
                accessibilityLabel={question.title}
                value={q.draft.values[0] ?? ""}
                onChange={q.setText}
                placeholder={question.placeholder}
                rows={3}
              />
            ) : question.kind === "single" ? (
              <RadioGroup
                accessibilityLabel={question.title}
                options={options}
                value={q.choice as string}
                onChange={q.setChoice}
              />
            ) : (
              <CheckboxGroup
                options={options}
                value={q.choice as readonly string[]}
                onChange={q.setChoice}
              />
            )}
            {q.draft.other !== null && question.kind !== "text" ? (
              <TextField label={t(K.other_label)} value={q.draft.other} onChange={q.setOther} />
            ) : null}
          </View>
        ) : (
          <View className="gap-3">
            <Card.Title level={3} className="text-base">
              {t(K.summary)}
            </Card.Title>
            {questions.map((item, index) => {
              const answer = q.answerOf(item);
              const values =
                answer === undefined ? [] : typeof answer === "string" ? [answer] : answer;
              return (
                <View key={item.id} className="flex-row items-start justify-between gap-3">
                  <View className="min-w-0 flex-1 gap-1">
                    <Text type="small" tone="muted">
                      {item.title}
                    </Text>
                    <View className="flex-row flex-wrap gap-1">
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
                    </View>
                  </View>
                  <Button
                    size="sm"
                    variant="ghost"
                    startIcon="pencil"
                    label={t(K.edit_answer, { question: item.title })}
                    onPress={() => q.edit(index)}
                  >
                    {t(K.edit)}
                  </Button>
                </View>
              );
            })}
          </View>
        )}
      </Card.Content>
      <Card.Footer className="flex-row flex-wrap items-center gap-2">
        {q.step > 0 ? (
          <Button variant="ghost" startIcon="chevron-left" onPress={q.back}>
            {t(K.back)}
          </Button>
        ) : null}
        <View className="flex-1" />
        {question && !question.isRequired ? (
          <Button variant="ghost" onPress={q.skip}>
            {t(K.skip)}
          </Button>
        ) : null}
        {question ? (
          <Button isDisabled={question.isRequired === true && !q.hasAnswer} onPress={q.next}>
            {q.isLast ? t(K.review) : t(K.next)}
          </Button>
        ) : (
          <Button isLoading={isSubmitting} onPress={() => onSubmit(q.answers())}>
            {submitLabel ?? t(K.submit)}
          </Button>
        )}
      </Card.Footer>
    </Card>
  );
}
