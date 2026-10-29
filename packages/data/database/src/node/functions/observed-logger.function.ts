/**
 * Stackra file contract:
 * Purpose: `observedLogger(options, observers)`, the MikroORM logger every connection of this package uses: MikroORM's
 *          own logger (so `debug` still prints), plus, for every statement the ORM runs, a count in each running
 *          `QueryTally` frame (by normalised shape) and a `QuerySample` handed to each `QueryObserver`.
 * Boundary: internal to this package's drivers (`loggerFactory`). MikroORM calls `logQuery` after every statement
 *           whatever the debug mode, so counting does not depend on it. A context without a statement is neither
 *           printed nor counted. Transaction control (`begin`, `commit`, `rollback`, `savepoint`, `release`, `set`) is
 *           not counted or observed. An observer that throws is ignored: telemetry never fails a query. Samples carry
 *           the normalised statement only, never the parameters.
 * Runtime: node
 * Governing contract: data-layer gaps scale-performance 7 and 8 (stackra-282, STA-1400); ADR 0097 (MikroORM only here).
 */
import { DefaultLogger } from "@mikro-orm/core";
import type { LogContext, Logger, LoggerOptions } from "@mikro-orm/core";

import type { QueryObserver } from "#contracts/ports/query-observer.port";
import type { QuerySample } from "#contracts/types/query-sample.type";
import { statementShape } from "#core/functions/statement-shape.function";
import { QUERY_TALLY } from "#node/constants/query-tally.constant";

/** Transaction control, which is not a query of the work. */
const CONTROL = new Set(["begin", "start", "commit", "rollback", "savepoint", "release", "set"]);

/**
 * The observed logger.
 *
 * @example
 * MikroORM.init({ ..., loggerFactory: (options) => observedLogger(options, observers) });
 */
export function observedLogger(
  options: LoggerOptions,
  observers: readonly QueryObserver[],
): Logger {
  const logger = new DefaultLogger(options);
  const logQuery = logger.logQuery.bind(logger);
  logger.logQuery = (context: LogContext): void => {
    // `DefaultLogger.logQuery` needs the statement; a context without one has nothing to print or count.
    const { query } = context;
    if (query === undefined) return;
    logQuery({ ...context, query });
    const { statement, verb, table } = statementShape(query);
    if (CONTROL.has(verb)) return;
    for (let tally = QUERY_TALLY.getStore(); tally !== undefined; tally = tally.parent) {
      tally.queries += 1;
      tally.shapes.set(statement, (tally.shapes.get(statement) ?? 0) + 1);
    }
    if (observers.length === 0) return;
    const rows = context.results ?? context.affected;
    const sample: QuerySample = Object.freeze({
      statement,
      verb,
      ...(table === undefined ? {} : { table }),
      durationMs: context.took ?? 0,
      ...(rows === undefined ? {} : { rows }),
      failed: context.level === "error",
      replica: context.connection?.type === "read",
    });
    for (const observer of observers)
      try {
        observer.observe(sample);
      } catch {
        // An observer's failure is telemetry lost, never a failed query.
      }
  };
  return logger;
}
