/**
 * Stackra file contract:
 * Purpose: `FakeAnswer<R>`, what `fake.on(Ref)` returns: how the fake answers calls of one ref, chainable
 *          (`fake.on(Attach).throwsOnce(error).returns(view)`).
 * Boundary: a type only. A value answer may be partial (a test states only the fields it reads) and is returned as is,
 *           without the output schema; a function answer receives the input decoded by the ref's input schema.
 * Runtime: node (vitest)
 * Governing contract: ADR 0269 (fakes); ADR 0260 (decision 10: tests override the client).
 */
import type { output } from "zod";

import type { CallRef } from "#core/types/call-ref.type";
import type { RefOutput } from "#core/types/ref-output.type";

/** An answer value: the ref's output, its object members' fields optional. */
type FakeOutput<T> = T extends object ? Partial<T> : T;

/** How the fake answers one ref. */
export interface FakeAnswer<R extends CallRef> {
  /** Answers every later call with `answer`, or with what `answer(input)` returns. */
  returns(
    answer:
      | FakeOutput<RefOutput<R>>
      | ((
          input: output<R["input"]>,
        ) => FakeOutput<RefOutput<R>> | Promise<FakeOutput<RefOutput<R>>>),
  ): FakeAnswer<R>;

  /** Rejects every later call with `error` (a refusal, a `TransportError`). */
  throws(error: unknown): FakeAnswer<R>;

  /** Rejects the next call with `error`, before any lasting answer. */
  throwsOnce(error: unknown): FakeAnswer<R>;

  /** Never settles a later call, so a test sees the loading state. */
  pending(): FakeAnswer<R>;
}
