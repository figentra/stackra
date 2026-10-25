/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Prompt`: both forms construct and stay `instanceof Prompt`, the bare form records
 *          the `prompt` kind with no options, the called form records its version with the default applied, a version
 *          that is not a whole number from 1 is refused, and the base is abstract.
 * Boundary: test only; the prompt is the template's `ExplainOrderPrompt`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0245 (decision 6); ADR 0294 (2026-10-23 item 5: bare or called).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Prompt } from "#core/bases/prompt.base";
import type { PromptClass } from "#core/types/prompt-class.type";

class ExplainOrderPrompt extends Prompt {}

class ExplainInvoicePrompt extends Prompt({ version: 2 }) {}

describe("Prompt", () => {
  it("constructs in both forms and stays an instance of Prompt", () => {
    expect(new ExplainOrderPrompt()).toBeInstanceOf(Prompt);
    expect(new ExplainInvoicePrompt()).toBeInstanceOf(Prompt);
    expect(Prompt.name).toBe("Prompt");
  });

  it("records the prompt kind, with the version of the called form", () => {
    expect(kindOf(ExplainOrderPrompt)).toEqual({ kind: "prompt", options: {} });
    expect(kindOf(ExplainInvoicePrompt)).toEqual({ kind: "prompt", options: { version: 2 } });
    expect(kindOf(Prompt({}))).toEqual({ kind: "prompt", options: { version: 1 } });
  });

  it("refuses a version that is not a whole number from 1", () => {
    for (const version of [0, -1, 1.5, Number.NaN])
      expect(() => Prompt({ version })).toThrow(RangeError);
  });

  it("types both forms as a prompt class and keeps the base abstract", () => {
    expectTypeOf(Prompt({ version: 3 })).toEqualTypeOf<PromptClass>();
    const classes: PromptClass[] = [ExplainOrderPrompt, ExplainInvoicePrompt];
    // @ts-expect-error -- the base is abstract
    const direct = new Prompt();
    expect([classes, direct]).toHaveLength(2);
  });
});
