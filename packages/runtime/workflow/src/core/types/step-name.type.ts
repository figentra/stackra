/**
 * Stackra file contract:
 * Purpose: `StepName<W>`, the step names of workflow `W`: its public methods that return a promise, other than
 *          `output` and the `undo<Step>` compensations. It types `@Step`'s target and `Run<W>["results"]`.
 * Boundary: a type only. Private members are not in `keyof`, so a private helper is never a step in the types; the
 *           engine, which cannot see `private`, treats every method other than `output` and `undo<Step>` as a step,
 *           so helpers belong in a service.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 18: steps are the public async methods); ADR 0151 (0294 note: the purity lint
 *                     limits public methods to steps, `undo<Step>` and `output`).
 */

/**
 * The step names of `W`.
 *
 * @example
 * type S = StepName<CreateOrderWorkflow>; // "price" | "reserveStock" | "createOrder" | "authorizePayment"
 */
export type StepName<W> = {
  [K in keyof W]-?: K extends "output" | `undo${Capitalize<string>}`
    ? never
    : W[K] extends (...args: never[]) => Promise<unknown>
      ? K
      : never;
}[keyof W] &
  string;
