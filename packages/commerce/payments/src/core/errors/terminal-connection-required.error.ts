/**
 * Stackra file contract:
 * Purpose: `TerminalConnectionRequiredError` (`terminal_connection_required`), the refusal of a terminal payment that
 *          names no Connection when more than one Connection of the Market can serve the terminal: a terminal id
 *          belongs to one provider, so guessing could send it to another.
 * Boundary: kind `Validation`, not retryable as it stands: the caller sends the terminal's `connectionId`. Carries the
 *           Market and the serving Connection ids, never credentials.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decision 2); ADR 0140; STA-1718.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The terminal's Connection is ambiguous.
 *
 * @example
 * throw TerminalConnectionRequiredError.create({ market: "sa", connections: "conn_a,conn_b" });
 */
export class TerminalConnectionRequiredError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The Market code. */
  market!: string;

  /** The Connections that could serve, comma-separated. */
  connections!: string;
}
