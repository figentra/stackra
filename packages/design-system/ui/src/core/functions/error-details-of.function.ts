/**
 * Stackra file contract:
 * Purpose: reads what an `ErrorState` may show of a caught value: a message and, when there is one, a stack. A thrown
 *          value can be anything in JavaScript, so this is the one place that decides what counts as a message.
 * Boundary: pure; it never throws and never shows a value that has no message of its own (a plain object would
 *           print as `[object Object]`). Whether the stack is shown is the component's choice, not this function's.
 *           Internal, not in the `.` barrel: the components import it by path.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0313 (decision 6); ADR 0140 (error envelope).
 */

/** The message of a caught value and, when it carries one, its stack. */
interface ErrorDetails {
  /** The text to show; never empty. */
  readonly message: string;
  /** The stack trace of an `Error`, for development builds. */
  readonly stack?: string | undefined;
}

/**
 * The details of a caught value.
 * @param error - whatever was thrown: an `Error`, an object with a `message`, a string or a number
 * @returns its message and stack, or `undefined` when it holds no text worth showing
 */
export function errorDetailsOf(error: unknown): ErrorDetails | undefined {
  if (typeof error === "string") return error === "" ? undefined : { message: error };
  if (typeof error === "number" || typeof error === "bigint" || typeof error === "boolean") {
    return { message: String(error) };
  }
  if (typeof error !== "object" || error === null) return undefined;
  const { message, stack } = error as { message?: unknown; stack?: unknown };
  if (typeof message !== "string" || message === "") return undefined;
  return { message, stack: typeof stack === "string" ? stack : undefined };
}
