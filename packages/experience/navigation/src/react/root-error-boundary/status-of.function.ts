/**
 * Stackra file contract:
 * Purpose: `statusOf(error)`, the HTTP status a caught route error stands for: an error response's own status, a
 *          refusal's kind status (`not_found` is 404), 500 for anything else.
 * Boundary: internal to the root error boundary.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (error envelope and kinds).
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { isRouteErrorResponse } from "react-router";

/**
 * The status of `error`.
 *
 * @example
 * statusOf(useRouteError()); // 404 for a thrown ctx.notFound()
 */
export function statusOf(error: unknown): number {
  if (isRouteErrorResponse(error)) return error.status;
  if (isRefusal(error)) return Enum.meta(ErrorKind, error.kind).httpStatus;
  return 500;
}
