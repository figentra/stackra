/**
 * Stackra file contract:
 * Purpose: `promptArguments(input)`, the MCP `arguments` list of a local prompt, derived from its zod object: each
 *          field's name, its `.describe()` text and whether it is required (it refuses `undefined`).
 * Boundary: pure; the zod object stays the one source of a prompt's arguments, so the list and the check never
 *           differ.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); the MCP `PromptArgument` shape; STA-2919.
 */
import type { z } from "zod";

/** One argument of a prompt, as `prompts/list` answers it. */
type PromptArgument = {
  readonly name: string;
  readonly description: string;
  readonly required: boolean;
};

/**
 * The arguments of a prompt.
 *
 * @param input - the prompt's zod object of string arguments.
 * @example
 * promptArguments(LOCAL_PROMPTS["explain-refusal"].input); // [{ name: "code", required: true, … }, …]
 */
export function promptArguments(input: z.ZodObject): PromptArgument[] {
  return Object.entries(input.shape).map(([name, field]) => ({
    name,
    description: (field as z.ZodType).description ?? "",
    required: !(field as z.ZodType).safeParse(undefined).success,
  }));
}
