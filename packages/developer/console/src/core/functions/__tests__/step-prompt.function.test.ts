/**
 * Stackra file contract:
 * Purpose: proves the prompt engine: typing and erasing, defaults, validation that keeps the prompt open, choice
 *          movement and search filtering, multiselect ticks, confirm toggles, cancel on Ctrl-C and Escape, and that a
 *          password frame never shows its characters.
 * Boundary: unit test of the pure reducer and renderers; no terminal.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-024 and FR-025; ADR 0022 (test placement).
 */
// @covers sta-1730:FR-024 sta-1730:FR-025
import type { PromptRequest } from "#contracts/types/prompt-request.type";
import { SYMBOLS } from "#core/constants/symbols.constant";
import { createPainter } from "#core/functions/create-painter.function";
import { openPrompt } from "#core/functions/open-prompt.function";
import { renderAnswer } from "#core/functions/render-answer.function";
import { renderPrompt } from "#core/functions/render-prompt.function";
import { stepPrompt } from "#core/functions/step-prompt.function";
import type { PromptKey } from "#core/types/prompt-key.type";
import type { PromptStep } from "#core/types/prompt-step.type";

const PAINT = {
  painter: createPainter(0, "#647384"),
  symbols: SYMBOLS.unicode,
  bidi: (text: string) => text,
};

/** Feeds `keys` to a prompt and returns the last step. */
function press(request: PromptRequest, ...keys: PromptKey[]): PromptStep {
  let step: PromptStep = { state: openPrompt(request) };
  for (const key of keys) {
    if (!("state" in step)) break;
    step = stepPrompt(step.state, key);
  }
  return step;
}

const type = (text: string): PromptKey[] =>
  [...text].map((sequence) => ({ sequence, name: sequence }));
const ENTER: PromptKey = { name: "return" };
const CHOICES = [
  { value: "pnpm" },
  { value: "npm" },
  { value: "yarn", label: "Yarn", hint: "classic" },
];

describe("stepPrompt", () => {
  it("types, erases and submits text", () => {
    expect(
      press(
        { kind: "text", message: "Name?" },
        ...type("Adx"),
        { name: "backspace" },
        ...type("a"),
        ENTER,
      ),
    ).toEqual({
      answer: "Ada",
    });
  });

  it("submits the default on an empty field", () => {
    expect(press({ kind: "text", message: "Name?", default: "world" }, ENTER)).toEqual({
      answer: "world",
    });
  });

  it("keeps the prompt open while validate refuses", () => {
    const request: PromptRequest = {
      kind: "text",
      message: "Hex?",
      validate: (value) => (value.startsWith("#") ? undefined : "Use #rrggbb"),
    };
    const step = press(request, ...type("ff"), ENTER);
    expect("state" in step && step.state.error).toBe("Use #rrggbb");
  });

  it("moves through choices and wraps around", () => {
    expect(
      press({ kind: "select", message: "PM?", choices: CHOICES }, { name: "up" }, ENTER),
    ).toEqual({ answer: "yarn" });
    expect(
      press(
        { kind: "select", message: "PM?", choices: CHOICES, default: "npm" },
        { name: "down" },
        ENTER,
      ),
    ).toEqual({
      answer: "yarn",
    });
  });

  it("ticks multiselect choices with space", () => {
    expect(
      press(
        { kind: "multiselect", message: "Which?", choices: CHOICES },
        { name: "space" },
        { name: "down" },
        { name: "down" },
        { name: "space" },
        ENTER,
      ),
    ).toEqual({
      answer: ["pnpm", "yarn"],
    });
  });

  it("filters search choices as it types", () => {
    expect(
      press({ kind: "search", message: "PM?", choices: CHOICES }, ...type("ya"), ENTER),
    ).toEqual({ answer: "yarn" });
  });

  it("toggles confirm", () => {
    expect(press({ kind: "confirm", message: "Sure?" }, ENTER)).toEqual({ answer: true });
    expect(press({ kind: "confirm", message: "Sure?" }, { name: "n" }, ENTER)).toEqual({
      answer: false,
    });
    expect(
      press({ kind: "confirm", message: "Sure?", default: false }, { name: "right" }, ENTER),
    ).toEqual({ answer: true });
  });

  it("cancels on Ctrl-C and Escape", () => {
    expect(press({ kind: "text", message: "Name?" }, { name: "c", ctrl: true })).toEqual({
      cancelled: true,
    });
    expect(press({ kind: "select", message: "PM?", choices: CHOICES }, { name: "escape" })).toEqual(
      { cancelled: true },
    );
  });
});

describe("renderPrompt", () => {
  it("never shows a password's characters", () => {
    const step = press({ kind: "password", message: "Token?" }, ...type("s3cret"));
    const frame = "state" in step ? renderPrompt(step.state, PAINT).join("\n") : "";
    expect(frame).not.toContain("s3cret");
    expect(frame).toContain("••••••");
    expect(renderAnswer({ kind: "password", message: "Token?" }, "s3cret", PAINT)).not.toContain(
      "s3cret",
    );
  });

  it("shows choices with the pointer, labels and hints", () => {
    const frame = renderPrompt(
      openPrompt({ kind: "select", message: "PM?", choices: CHOICES }),
      PAINT,
    );
    expect(frame[1]).toContain("› pnpm");
    expect(frame[3]).toContain("Yarn classic");
  });
});
