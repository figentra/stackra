/**
 * Stackra file contract:
 * Purpose: `answerFailure(error, { correlationId, reporter })`, the answer of whatever a call threw instead of
 *          answering: a refusal is `answerRefusal`'s (its kind's status and envelope); anything else is reported once to
 *          the `ErrorReporter` with the correlation id and answered 500 with the `internal` envelope
 *          (`{ code: "internal", category: "internal", retryable: false, correlationId }`), so a client always reads
 *          the ADR 0140 envelope and support finds the report from the id the client holds.
 * Boundary: never throws and never rejects. The 500 says nothing of the error (no message, name or stack); the error
 *           goes to the reporter as it is, whose driver scrubs it. A refusal whose envelope cannot be written (a detail
 *           JSON cannot hold) is a fault, so it is reported and answered 500 too.
 * Runtime: node
 * Governing contract: ADR 0140 (decisions 1 to 3: the envelope and the `internal` category); ADR 0232 (decision 8:
 *                     report what was not handled, once); ADR 0184 (decision 6: crashes go to Sentry).
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import type { ErrorEnvelope } from "@stackra/errors";
import type { ErrorReporter } from "@stackra/errors/contracts";

import { answerRefusal } from "#server/functions/answer-refusal.function";

/**
 * The answer of `error`.
 *
 * @example
 * try { answered = await handle(request, container, correlationId); }
 * catch (error) { answered = answerFailure(error, { correlationId, reporter: app.reporter }); }
 */
export function answerFailure(
  error: unknown,
  options: { readonly correlationId: string; readonly reporter: ErrorReporter },
): Response {
  const { correlationId, reporter } = options;
  if (isRefusal(error))
    try {
      return answerRefusal(error, correlationId);
    } catch {
      // its envelope does not serialise: a fault of the refusal's author, reported below
    }
  try {
    reporter.report(error, { correlationId });
  } catch {
    // a reporter never throws; if one does, the client still gets its answer
  }
  // the `internal` row of the one table: category, retry flag and status (ADR 0140 decision 3)
  const internal = Enum.meta(ErrorKind, ErrorKind.Internal);
  const envelope: ErrorEnvelope = {
    code: ErrorKind.Internal,
    category: internal.category,
    retryable: internal.retryable,
    correlationId,
  };
  return Response.json(envelope, { status: internal.httpStatus });
}
