/**
 * Stackra file contract:
 * Purpose: `askMissing(structure, values, prompt)`, the values of a run with every prompted field the invocation left
 *          out asked for, in field order: a flag as a confirm, a field with choices as a select (a multiselect for a
 *          `@List`), a secret as a password, anything else as text checked like a command-line token. A run that is
 *          not interactive takes each field's default, or exits 2 naming the option that answers it.
 * Boundary: asks through `ConsolePrompt` only; a given value is never asked again.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-018.
 */
import type { CommandField } from "#contracts/types/command-field.type";
import type { CommandStructure } from "#contracts/types/command-structure.type";
import type { PromptAnswer } from "#contracts/types/prompt-answer.type";
import { convertToken } from "#core/functions/convert-token.function";
import { isSecret } from "#core/functions/is-secret.function";
import type { ConsolePrompt } from "#core/types/console-prompt.type";

/** The field's initialiser as a prompt's default. */
function defaultOf(field: CommandField): PromptAnswer | undefined {
  const value = field.default;
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  return Array.isArray(value) ? value.map(String) : String(value);
}

/** The message of a refused answer, else undefined. */
function refusal(field: CommandField, answer: string): string | undefined {
  try {
    convertToken(field, answer);
    return undefined;
  } catch (error) {
    return (error as Error).message;
  }
}

/** `values` with the left-out prompted fields of `structure` asked for. */
export async function askMissing(
  structure: CommandStructure,
  values: Readonly<Record<string, unknown>>,
  prompt: ConsolePrompt,
): Promise<Readonly<Record<string, unknown>>> {
  const filled: Record<string, unknown> = { ...values };
  for (const field of [...structure.arguments, ...structure.options]) {
    if (field.prompt === undefined || filled[field.property] !== undefined) continue;
    const fallback = defaultOf(field);
    const request = {
      message: field.prompt,
      ...(field.role === "option" ? { option: field.flag } : {}),
      ...(fallback === undefined ? {} : { default: fallback }),
      ...(field.choices === undefined
        ? {}
        : { choices: field.choices.map((value) => ({ value })) }),
    };
    if (field.kind === "boolean") filled[field.property] = await prompt.confirm(request);
    else if (field.choices !== undefined && field.list)
      filled[field.property] = await prompt.multiselect(request);
    else if (field.choices !== undefined) filled[field.property] = await prompt.select(request);
    else {
      const checked = { ...request, validate: (text: string) => refusal(field, text) };
      const answer = await (isSecret(field) ? prompt.password(checked) : prompt.text(checked));
      filled[field.property] = field.list
        ? answer
            .split(",")
            .map((token) => token.trim())
            .filter((token) => token !== "")
            .map((token) => convertToken(field, token))
        : convertToken(field, answer);
    }
  }
  return filled;
}
