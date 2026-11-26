/**
 * Stackra file contract:
 * Purpose: `renderQuestionPart`, the default renderer of a `data-tamo-question` part: with the turn's `onAnswer`, a
 *          @stackra/ui `QuestionnaireCard` of the one question (one choice, several, or free text when it has no
 *          choices) whose sent answer calls `onAnswer(questionId, { [questionId]: answer })`; without it, the question
 *          and its choices as read-only text.
 * Boundary: pure over the part's data, read defensively: without a string id and prompt it draws nothing, and a choice
 *           without a string value and label is skipped. It answers nothing itself: the host's `onAnswer` does.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0507 (Ask Tamo); ADR 0165 (UI through @stackra/ui).
 */
import type { ChoiceOption } from "@stackra/ui/contracts";
import { QuestionnaireCard, Text } from "@stackra/ui/react";
import type { ReactNode } from "react";

import type { ChatPartOptions } from "#react/chat-surface/chat-part-options.type";

/** The value as an object's fields, else undefined. */
const fieldsIn = (value: unknown): Readonly<Record<string, unknown>> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;

/** The part's choices that carry a string value and label. */
const choicesOf = (value: unknown): ChoiceOption[] =>
  Array.isArray(value)
    ? value.flatMap((entry: unknown) => {
        const choice = fieldsIn(entry);
        return typeof choice?.["value"] === "string" && typeof choice["label"] === "string"
          ? [{ value: choice["value"], label: choice["label"] }]
          : [];
      })
    : [];

/**
 * A question part as a QuestionnaireCard (or read-only text without `onAnswer`), or null when it has no id or prompt.
 *
 * @example
 * renderQuestionPart({ id: "q1", prompt: "Which branch?", choices }, part, { onAnswer, isWriting: false })
 */
export function renderQuestionPart(
  data: unknown,
  _part: unknown,
  options: ChatPartOptions,
): ReactNode {
  const fields = fieldsIn(data);
  const id = fields?.["id"];
  const prompt = fields?.["prompt"];
  if (typeof id !== "string" || typeof prompt !== "string") return null;
  const choices = choicesOf(fields?.["choices"]);
  const onAnswer = options.onAnswer;
  if (onAnswer === undefined) {
    return (
      <div className="grid gap-1">
        <Text>{prompt}</Text>
        {choices.length > 0 && (
          <ul className="grid gap-1">
            {choices.map((choice) => (
              <li key={choice.value}>
                <Text type="small" tone="muted">
                  {choice.label}
                </Text>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  return (
    <QuestionnaireCard
      title={prompt}
      questions={[
        {
          id,
          title: prompt,
          kind:
            choices.length === 0 ? "text" : fields?.["multiple"] === true ? "multiple" : "single",
          options: choices.length === 0 ? undefined : choices,
          isRequired: true,
        },
      ]}
      onSubmit={(answers) => onAnswer(id, { ...answers })}
    />
  );
}
