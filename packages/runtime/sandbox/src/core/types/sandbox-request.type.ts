/**
 * Stackra file contract:
 * Purpose: `SandboxRequest`, one run of a code step: the tenant's code and its language, its JSON input, its limits,
 *          the origins its `fetch` may reach, and the caller's reference for the audit.
 * Boundary: a type only, plain data. The code is the body of an async function of `input` whose returned value is the
 *           output; it is JavaScript (a TypeScript step is compiled to it before it is stored) or, with `language:
 *           "python"`, the body of `async def step(input)`, which only a `SandboxPool` runs.
 * Runtime: isomorphic
 * Governing contract: ADR 0154 (decisions 1, 2, 5, 6 and 7); ADR 0434 (decision 1).
 */
import type { Json } from "@stackra/contracts";

import type { SandboxLanguage } from "#core/types/sandbox-language.type";
import type { SandboxLimits } from "#core/types/sandbox-limits.type";

/**
 * A code-step run.
 *
 * @example
 * await sandbox.run({
 *   code: "const total = input.lines.reduce((sum, line) => sum + line.amount, 0);\nreturn { total };",
 *   input: { lines },
 *   limits,
 *   allowedOrigins: [],
 *   reference: ctx.stepKey,
 * });
 */
export interface SandboxRequest {
  /** The body of `async function (input) { ... }`; what it returns is the output. */
  readonly code: string;

  /** The code's language; `javascript` when absent. `python` runs only in a `SandboxPool`. */
  readonly language?: SandboxLanguage;

  /** The value of `input`. */
  readonly input: Json;

  /** The bounds of the run, from the tenant's plan. */
  readonly limits: SandboxLimits;

  /** The origins (`https://api.example.com`) `fetch` may reach; empty for none. */
  readonly allowedOrigins: readonly string[];

  /** The caller's id of the run (a workflow step key), handed to the fetch proxy for its audit. */
  readonly reference: string;
}
