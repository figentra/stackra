/**
 * Stackra file contract:
 * Purpose: `LogLevel`, the four levels of a log line, in rising severity: the levels of the `Logger` port's methods,
 *          the threshold a configuration sets and the `level` of a `LogRecord`.
 * Boundary: an `Enum.of` value plus the type of the same name. Source order is severity order; the codes are also the
 *           names of the `console` methods the console reporter writes with.
 * Runtime: isomorphic
 * Governing contract: ADR 0147 (decision 1); ADR 0231 (snake_case codes); ADR 0294 (decision 26).
 */
import { Enum } from "@stackra/contracts";

/** The levels, lowest first. */
export const LogLevel = Enum.of({
  /** Detail for a developer. */
  Debug: "debug",
  /** Something worth knowing happened. */
  Info: "info",
  /** Something unexpected happened and was handled. */
  Warn: "warn",
  /** Something failed. */
  Error: "error",
});

/** One of the codes above. */
export type LogLevel = Enum.Value<typeof LogLevel>;
