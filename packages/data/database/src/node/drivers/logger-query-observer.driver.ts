/**
 * Stackra file contract:
 * Purpose: `LoggerQueryObserverDriver`, a `QueryObserver` that logs every statement at or above
 *          `DatabaseConfig.queries.slow` as `database.slow_query`: its normalised statement, verb, table, duration,
 *          rows and replica flag, tagged with the running call's key and scope id when a call is running.
 * Boundary: a driver of this package's port (driver name `logger`). The statement carries no value (`statementShape`),
 *           so the log holds no person's data. The call is read from the actions `ContextStorage` when one is
 *           passed; outside a call (a job, a migration) the entry has no key. Faster statements are not logged.
 * Runtime: node
 * Governing contract: data-layer gap scale-performance 7 (stackra-282, STA-1400); ADR 0147 (decision 3: ids and codes,
 *                     no values); ADR 0142 (drivers).
 */
import type { ContextStorage } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import { Duration, type Logger } from "@stackra/contracts";

import type { DatabaseConfig } from "#config/database.config";
import { QueryObserver } from "#contracts/ports/query-observer.port";
import type { QuerySample } from "#contracts/types/query-sample.type";
import { QUERY_EVENTS } from "#node/constants/query-events.constant";

/** What the running call context exposes to tag a statement. */
type CallTag = {
  readonly key?: unknown;
  readonly scopeId?: unknown;
  readonly scope?: { id?: unknown };
};

/**
 * The slow-statement log.
 *
 * @example
 * await PostgresDatabaseDriver.connect({ url, observers: [new LoggerQueryObserverDriver(config, logger, storage)] });
 */
export class LoggerQueryObserverDriver extends Driver(QueryObserver) {
  /** The slow threshold in milliseconds. */
  private readonly slowMs: number;

  /** Where slow statements go. */
  private readonly logger: Logger;

  /** The running call, when the actions context storage is bound. */
  private readonly storage: ContextStorage | undefined;

  /**
   * @param config - `queries.slow` is the threshold.
   * @param logger - takes the slow-statement entries.
   * @param storage - the actions context storage, to tag an entry with the running call's key and scope.
   */
  constructor(config: DatabaseConfig, logger: Logger, storage?: ContextStorage) {
    super();
    this.slowMs = Duration.toMilliseconds(config.queries.slow);
    this.logger = logger;
    this.storage = storage;
  }

  /** Logs `sample` when it took at least the slow threshold. */
  override observe(sample: QuerySample): void {
    if (sample.durationMs < this.slowMs) return;
    const call = this.storage?.current() as CallTag | undefined;
    const scopeId = call?.scope?.id ?? call?.scopeId;
    this.logger.warn(QUERY_EVENTS.slow, {
      ...sample,
      ...(typeof call?.key === "string" ? { action: call.key } : {}),
      ...(typeof scopeId === "string" ? { scopeId } : {}),
    });
  }
}
