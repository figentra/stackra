/**
 * Stackra file contract:
 * Purpose: proves the web QuestionnaireCard asks one question at a time with its progress, moves focus to the new
 *          heading and announces the step, waits for a required answer, takes an "Other" text, skips, summarises the
 *          answers with an edit that returns to the summary, and sends the answers.
 * Boundary: jsdom with real HeroUI.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); WCAG 2.2 SC 2.4.3, 4.1.3; STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import type { QuestionnaireQuestion } from "#contracts/types/questionnaire-question.type";
import { QuestionnaireCard } from "#react/questionnaire-card/questionnaire-card";

const press = (name: string | RegExp) =>
  act(() => fireEvent.click(screen.getByRole("button", { name })));

const QUESTIONS: readonly QuestionnaireQuestion[] = [
  {
    id: "goal",
    title: "What is the offer for?",
    kind: "single",
    isRequired: true,
    allowsOther: true,
    options: [
      { value: "clear", label: "Clear old stock" },
      { value: "launch", label: "Launch a product" },
    ],
  },
  {
    id: "branches",
    title: "Which branches?",
    kind: "multiple",
    options: [
      { value: "olaya", label: "Olaya" },
      { value: "tahlia", label: "Tahlia" },
    ],
  },
  { id: "notes", title: "Anything else?", kind: "text" },
];

describe("QuestionnaireCard (web)", () => {
  it("steps through the questions, takes Other, skips and sends", () => {
    const onSubmit = vi.fn();
    render(
      <QuestionnaireCard
        title="Before I draft the offer"
        questions={QUESTIONS}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getByRole("region", { name: "Before I draft the offer" })).toBeTruthy();
    expect(screen.getAllByText("Question 1 of 3").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();
    expect(screen.getByRole("button", { name: "Next" }).hasAttribute("disabled")).toBe(true);

    act(() => fireEvent.click(screen.getByRole("radio", { name: "Other" })));
    fireEvent.change(screen.getByRole("textbox", { name: "Your answer" }), {
      target: { value: "Eid sale" },
    });
    press("Next");
    const heading = screen.getByRole("heading", { name: "Which branches?" });
    expect(document.activeElement).toBe(heading);
    expect(screen.getByRole("status").textContent).toBe("Question 2 of 3");

    act(() => fireEvent.click(screen.getByRole("checkbox", { name: "Tahlia" })));
    press("Next");
    press("Skip");
    expect(screen.getByRole("heading", { name: "Your answers" })).toBeTruthy();
    expect(screen.getByText("Eid sale")).toBeTruthy();
    expect(screen.getByText("Skipped")).toBeTruthy();

    press("Send answers");
    expect(onSubmit).toHaveBeenCalledWith({ goal: "Eid sale", branches: ["tahlia"] });
  });

  it("edits one answer from the summary and comes back", () => {
    const onSubmit = vi.fn();
    render(
      <QuestionnaireCard
        title="Offer"
        questions={QUESTIONS}
        defaultAnswers={{ goal: "clear", branches: ["olaya"], notes: "Weekends only" }}
        onSubmit={onSubmit}
      />,
    );
    press("Next");
    press("Next");
    press("Review answers");
    press("Edit the answer to: Which branches?");
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Which branches?" }));
    act(() => fireEvent.click(screen.getByRole("checkbox", { name: "Tahlia" })));
    press("Review answers");
    press("Send answers");
    expect(onSubmit).toHaveBeenCalledWith({
      goal: "clear",
      branches: ["olaya", "tahlia"],
      notes: "Weekends only",
    });
  });
});
