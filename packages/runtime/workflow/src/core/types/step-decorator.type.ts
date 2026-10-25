/**
 * Stackra file contract:
 * Purpose: `StepDecorator`, what `@Step(options)` returns: a legacy method decorator that fits only a step of its
 *          class, so `@Step` on `output`, an undo, a private method or a field fails to compile.
 * Boundary: a type only; the runtime decorator is the one `createDecorator` made.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 6: `@Step` is one of the two method decorators); ADR 0005 (legacy
 *                     decorators); the STA-335 spike (the decorator types its target).
 */
import type { StepName } from "#core/types/step-name.type";

/** A method decorator for a step of `T`. */
export type StepDecorator = <T extends object>(
  target: T,
  key: StepName<T>,
  descriptor: PropertyDescriptor,
) => void;
