/**
 * Stackra file contract:
 * Purpose: `clackPrompter(input, output)`, the interactive default `Prompter`: each request asked with Clack (text,
 *          password, confirm, select, multiselect, and search as an autocomplete), its default preselected, its
 *          `validate` kept until it passes, and a cancel (Ctrl-C, Escape) thrown as `PromptCancelledError`.
 * Boundary: node only; reads and writes the given streams. `nodePorts()` uses it while the run is interactive; the
 *           kernel never asks without a terminal.
 * Runtime: node
 * Governing contract: STA-1966 spec FR-005; ADR 0506 (amendment of 2026-11-02, decision 2).
 */
import type { Readable, Writable } from "node:stream";

import {
  autocomplete,
  confirm,
  isCancel,
  multiselect,
  password,
  select,
  text,
} from "@clack/prompts";

import type { PromptAnswer } from "#contracts/types/prompt-answer.type";
import type { PromptRequest } from "#contracts/types/prompt-request.type";
import type { Prompter } from "#contracts/types/prompter.type";
import { PromptCancelledError } from "#core/errors/prompt-cancelled.error";

/** Throws when the Operator cancelled, else returns the answer. */
function answered<T>(message: string, value: T): Exclude<T, symbol> {
  if (isCancel(value)) throw new PromptCancelledError(message);
  return value as Exclude<T, symbol>;
}

/** A Clack prompter on `input` and `output`. */
export function clackPrompter(input: Readable, output: Writable): Prompter {
  return {
    ask: async (request: PromptRequest): Promise<PromptAnswer> => {
      const streams = { input, output };
      const options = (request.choices ?? []).map((choice) => ({
        value: choice.value,
        label: choice.label ?? choice.value,
        ...(choice.hint === undefined ? {} : { hint: choice.hint }),
      }));
      const validate = (value: string | undefined) => request.validate?.(value ?? "");
      const initial = typeof request.default === "string" ? request.default : undefined;
      switch (request.kind) {
        case "password": {
          return answered(
            request.message,
            await password({ ...streams, message: request.message, validate }),
          );
        }
        case "confirm": {
          const value = await confirm({
            ...streams,
            message: request.message,
            ...(typeof request.default === "boolean" ? { initialValue: request.default } : {}),
          });
          return answered(request.message, value);
        }
        case "select": {
          const value = await select({
            ...streams,
            message: request.message,
            options,
            ...(initial === undefined ? {} : { initialValue: initial }),
          });
          return answered(request.message, value);
        }
        case "multiselect": {
          const value = await multiselect({
            ...streams,
            message: request.message,
            options,
            required: false,
            ...(Array.isArray(request.default) ? { initialValues: [...request.default] } : {}),
          });
          return answered(request.message, value);
        }
        case "search": {
          const value = await autocomplete({
            ...streams,
            message: request.message,
            options,
            ...(initial === undefined ? {} : { initialValue: initial }),
          });
          return answered(request.message, value);
        }
        default: {
          const value = await text({
            ...streams,
            message: request.message,
            // Clack validates what was typed before it falls back to defaultValue: an empty answer takes the default,
            // so the default is what gets checked.
            validate: (typed) => validate(typed === undefined || typed === "" ? initial : typed),
            ...(request.placeholder === undefined ? {} : { placeholder: request.placeholder }),
            ...(initial === undefined
              ? {}
              : { defaultValue: initial, placeholder: request.placeholder ?? initial }),
          });
          return answered(request.message, value);
        }
      }
    },
  };
}
