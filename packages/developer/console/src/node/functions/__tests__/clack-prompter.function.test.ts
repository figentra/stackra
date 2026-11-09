/**
 * Stackra file contract:
 * Purpose: proves the Clack prompter maps each request kind to its Clack prompt with the default preselected and the
 *          choices as options, keeps the request's `validate`, and throws `PromptCancelledError` on a cancel.
 * Boundary: unit test; `@clack/prompts` is replaced by a fake that records each call.
 * Runtime: node
 * Governing contract: STA-1966 spec FR-005; ADR 0022 (test placement).
 */
// @covers sta-1966:FR-005
import { PassThrough } from "node:stream";

import { PromptCancelledError } from "#core/errors/prompt-cancelled.error";
import { clackPrompter } from "#node/functions/clack-prompter.function";

const fake = vi.hoisted(() => ({
  CANCEL: Symbol("cancel"),
  calls: [] as { kind: string; options: Record<string, unknown> }[],
  next: undefined as unknown,
}));

/** A fake Clack prompt of `kind` that records its options and answers `fake.next`. */
function prompt(kind: string) {
  return async (options: Record<string, unknown>) => {
    fake.calls.push({ kind, options });
    return fake.next;
  };
}
const { CANCEL, calls } = fake;

vi.mock("@clack/prompts", () => {
  return {
    text: prompt("text"),
    password: prompt("password"),
    confirm: prompt("confirm"),
    select: prompt("select"),
    multiselect: prompt("multiselect"),
    autocomplete: prompt("autocomplete"),
    isCancel: (value: unknown) => value === fake.CANCEL,
  };
});

const prompter = clackPrompter(new PassThrough(), new PassThrough());

describe("clackPrompter", () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it("asks a select with its choices and the default preselected", async () => {
    fake.next = "service";
    const answer = await prompter.ask({
      kind: "select",
      message: "Which template?",
      default: "app",
      choices: [{ value: "app" }, { value: "service", hint: "an Encore service" }],
    });
    expect(answer).toBe("service");
    expect(calls[0]?.kind).toBe("select");
    expect(calls[0]?.options).toMatchObject({
      message: "Which template?",
      initialValue: "app",
      options: [
        { value: "app", label: "app" },
        { value: "service", label: "service", hint: "an Encore service" },
      ],
    });
  });

  it("maps confirm, multiselect, search and password, and keeps text's validate", async () => {
    fake.next = true;
    await prompter.ask({ kind: "confirm", message: "Install?", default: false });
    fake.next = ["a"];
    await prompter.ask({
      kind: "multiselect",
      message: "Which?",
      choices: [{ value: "a" }],
      default: ["a"],
    });
    fake.next = "a";
    await prompter.ask({ kind: "search", message: "Find", choices: [{ value: "a" }] });
    fake.next = "s3cret";
    await prompter.ask({ kind: "password", message: "Token?" });
    fake.next = "acme";
    await prompter.ask({
      kind: "text",
      message: "Name?",
      validate: (text) => (text === "" ? "required" : undefined),
    });
    expect(calls.map((call) => call.kind)).toEqual([
      "confirm",
      "multiselect",
      "autocomplete",
      "password",
      "text",
    ]);
    expect(calls[0]?.options).toMatchObject({ initialValue: false });
    expect(calls[1]?.options).toMatchObject({ initialValues: ["a"], required: false });
    const validate = calls[4]?.options["validate"] as (
      value: string | undefined,
    ) => string | undefined;
    expect(validate(undefined)).toBe("required");
    expect(validate("acme")).toBeUndefined();
  });

  it("checks the default, not the empty input, when Enter accepts a text default", async () => {
    fake.next = "first-release";
    await prompter.ask({
      kind: "text",
      message: "Release name?",
      default: "first-release",
      validate: (text) => (text.length < 3 ? `at least 3 characters, got "${text}"` : undefined),
    });
    const validate = calls[0]?.options["validate"] as (
      value: string | undefined,
    ) => string | undefined;
    expect(calls[0]?.options).toMatchObject({ defaultValue: "first-release" });
    expect(validate("")).toBeUndefined();
    expect(validate(undefined)).toBeUndefined();
    expect(validate("ab")).toBe('at least 3 characters, got "ab"');
  });

  it("throws PromptCancelledError when the Operator cancels", async () => {
    fake.next = CANCEL;
    await expect(prompter.ask({ kind: "text", message: "Name?" })).rejects.toBeInstanceOf(
      PromptCancelledError,
    );
  });
});
