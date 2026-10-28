/**
 * Stackra file contract:
 * Purpose: `sessionTimeoutsUrl(url, timeouts)`, a connection string carrying the session timeouts as the Postgres
 *          startup `options` parameter (`-c statement_timeout=... -c lock_timeout=...
 *          -c idle_in_transaction_session_timeout=...`), so every pooled session starts with them.
 * Boundary: internal to the drivers' `connect`. Values are whole milliseconds from configuration; an `options`
 *           parameter the URL already holds is kept, ahead of the timeouts. The URL is a secret: never logged here.
 * Runtime: node
 * Governing contract: data-layer gap sc5 (stackra-253); ADR 0173 (the connection string is a secret).
 */
import { timeoutMilliseconds } from "#core/functions/timeout-milliseconds.function";
import type { SessionTimeouts } from "#core/types/session-timeouts.type";

/**
 * The connection string with the timeouts added.
 *
 * @throws TypeError when `url` is not a URL.
 * @example
 * sessionTimeoutsUrl("postgres://h/db", { statement: Duration.seconds(30), lock: Duration.seconds(10), idleInTransaction: Duration.seconds(60) });
 * // "postgres://h/db?options=-c+statement_timeout%3D30000+-c+lock_timeout%3D10000+-c+idle_in_transaction_session_timeout%3D60000"
 */
export function sessionTimeoutsUrl(url: string, timeouts: SessionTimeouts | undefined): string {
  if (timeouts === undefined) return url;
  const parsed = new URL(url);
  const flags = [
    ["statement_timeout", timeouts.statement],
    ["lock_timeout", timeouts.lock],
    ["idle_in_transaction_session_timeout", timeouts.idleInTransaction],
  ] as const;
  const options = flags
    .map(([name, value]) => `-c ${name}=${timeoutMilliseconds(value)}`)
    .join(" ");
  const held = parsed.searchParams.get("options");
  parsed.searchParams.set("options", held === null ? options : `${held} ${options}`);
  return parsed.toString();
}
