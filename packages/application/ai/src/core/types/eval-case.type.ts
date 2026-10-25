/**
 * Stackra file contract:
 * Purpose: `EvalCase<I, O>`, one case of an agent's or a prompt's eval suite: a name, the input, and the check its
 *          output must pass.
 * Boundary: a type only; suites live beside the prompt or skill they test and run in CI on AI SDK's mock or recorded
 *           models.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4: each agent and built-in prompt has an eval suite); ADR 0100 (decision 12).
 */

/** One eval case. */
export interface EvalCase<I, O> {
  /** The case's name, unique in its suite. */
  readonly name: string;

  /** What the subject is given. */
  readonly input: I;

  /** Whether the subject's output is acceptable. */
  check(output: O): boolean;
}
