/**
 * Stackra file contract:
 * Purpose: proves a QuestionnaireCard answer survives the round trip through its draft: options stay values, an
 *          unknown value becomes the "Other" text, blank answers report nothing, and "Other" comes last in a list.
 * Boundary: the pure functions `questionnaireDraftOf` and `questionnaireAnswerOf` only.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave D).
 */
import type { QuestionnaireQuestion } from "#contracts/types/questionnaire-question.type";
import { questionnaireAnswerOf } from "#core/functions/questionnaire-answer-of.function";
import { questionnaireDraftOf } from "#core/functions/questionnaire-draft-of.function";

const OPTIONS = [
  { value: "riyadh", label: "Riyadh" },
  { value: "jeddah", label: "Jeddah" },
];
const SINGLE: QuestionnaireQuestion = {
  id: "s",
  title: "S",
  kind: "single",
  options: OPTIONS,
  allowsOther: true,
};
const MULTIPLE: QuestionnaireQuestion = { ...SINGLE, id: "m", kind: "multiple" };
const TEXT: QuestionnaireQuestion = { id: "t", title: "T", kind: "text" };

describe("questionnaire drafts", () => {
  it("reads an option or the Other text from a single answer", () => {
    expect(questionnaireDraftOf(SINGLE, "jeddah")).toEqual({ values: ["jeddah"], other: null });
    expect(questionnaireDraftOf(SINGLE, "Dammam")).toEqual({ values: [], other: "Dammam" });
    expect(questionnaireDraftOf({ ...SINGLE, allowsOther: false }, "Dammam")).toEqual({
      values: [],
      other: null,
    });
    expect(questionnaireDraftOf(SINGLE, undefined)).toEqual({ values: [], other: null });
  });

  it("reports a single answer, the trimmed Other text, or nothing", () => {
    expect(questionnaireAnswerOf(SINGLE, { values: ["riyadh"], other: null })).toBe("riyadh");
    expect(questionnaireAnswerOf(SINGLE, { values: [], other: "  Dammam " })).toBe("Dammam");
    expect(questionnaireAnswerOf(SINGLE, { values: [], other: " " })).toBeUndefined();
    expect(questionnaireAnswerOf(SINGLE, { values: [], other: null })).toBeUndefined();
  });

  it("keeps a multiple answer's values with the Other text last", () => {
    const draft = questionnaireDraftOf(MULTIPLE, ["jeddah", "Online", "riyadh"]);
    expect(draft).toEqual({ values: ["jeddah", "riyadh"], other: "Online" });
    expect(questionnaireAnswerOf(MULTIPLE, draft)).toEqual(["jeddah", "riyadh", "Online"]);
    expect(questionnaireAnswerOf(MULTIPLE, { values: [], other: "" })).toBeUndefined();
  });

  it("keeps free text and drops blank text", () => {
    expect(questionnaireDraftOf(TEXT, "Ramadan")).toEqual({ values: ["Ramadan"], other: null });
    expect(questionnaireAnswerOf(TEXT, { values: ["Ramadan"], other: null })).toBe("Ramadan");
    expect(questionnaireAnswerOf(TEXT, { values: ["  "], other: null })).toBeUndefined();
  });
});
