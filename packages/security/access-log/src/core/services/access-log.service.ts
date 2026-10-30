/**
 * Stackra file contract:
 * Purpose: `AccessLogService`, the only writer of the sink: builds a record from a logged call and hands it to the
 *          sink. A sink failure is reported through the logger as `access_log_write_failed`; for a class that fails
 *          closed (a configured `failClosed` classification, or a facet marked `failClosed: true`) the failure is then
 *          thrown as `AccessLogWriteFailedError`, so the read is not served unlogged. Every other class fails open.
 * Boundary: exported by `AccessLogModule`. It resolves the subjects from the facet's options: the principal the call is
 *           for, or the named field of every record among the call's arguments and result. A call that touched no
 *           subject writes nothing. Which classes fail closed is configuration (`AccessLogConfig.failClosed`), never
 *           code. `Logger` and `Clock` are ports of @stackra/contracts, injected by type.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 5 and open question 1); ADR 0134 (classification); ADR 0184 (telemetry);
 *                     ADR 0294 (decisions 6 and 16); ADR 0409 (fail-closed classes, STA-821);
 *                     ADR 0494 (a credential read always fails closed).
 */
import { Service } from "@stackra/container";
import { DataClassification } from "@stackra/contracts";
import type { Actor, Clock, Logger } from "@stackra/contracts";

import type { AccessLogConfig } from "#config/access-log.config";
import type { AccessLogSink } from "#contracts/ports/access-log-sink.port";
import type { AccessLoggedOptions } from "#contracts/types/access-logged-options.type";
import { ACCESS_LOG_WRITE_FAILED } from "#core/constants/access-log-write-failed.constant";
import { AccessLogWriteFailedError } from "#core/errors/access-log-write-failed.error";

/**
 * Called by `AccessLogExplorer` around every declared method of an `@AccessLogged` class.
 *
 * @example
 * await accessLog.record(ctx.callId, ctx.actor, "OrderService.find", options, [orderId, order]);
 */
export class AccessLogService extends Service {
  /** The configured sink driver. */
  private readonly sink: AccessLogSink;

  /** Where a sink failure is reported. */
  private readonly logger: Logger;

  /** The time a record is stamped with. */
  private readonly clock: Clock;

  /** The access log's configuration: which classes fail closed. */
  private readonly config: AccessLogConfig;

  /**
   * @param sink - the configured sink driver, by type.
   * @param logger - where a sink failure is reported.
   * @param clock - the time source, so a test can pin a record's `at`.
   * @param config - the access log's configuration.
   */
  constructor(sink: AccessLogSink, logger: Logger, clock: Clock, config: AccessLogConfig) {
    super();
    this.sink = sink;
    this.logger = logger;
    this.clock = clock;
    this.config = config;
  }

  /**
   * Writes one record, or none when the call touched no subject. A sink error is logged as `access_log_write_failed`
   * with the call id and target, so an operator can find the gap; it then rejects only for a class that fails closed.
   *
   * @param callId - the id of the action or query call the access ran in.
   * @param actor - the full actor with its `onBehalfOf` chain.
   * @param target - `<Class>.<method>` that was called.
   * @param options - the class's `@AccessLogged` options.
   * @param values - the call's arguments, then its result when it returned one.
   * @throws AccessLogWriteFailedError when the sink failed and the class fails closed.
   */
  async record(
    callId: string,
    actor: Actor,
    target: string,
    options: AccessLoggedOptions,
    values: readonly unknown[],
  ): Promise<void> {
    const subjects = this.subjectsOf(options, actor, values);
    if (subjects.length === 0) return; // the call exposed nobody's data
    try {
      await this.sink.write({
        callId,
        actor,
        target,
        classification: options.classification,
        subjects,
        at: this.clock.now(),
      });
    } catch (error) {
      this.logger.error(ACCESS_LOG_WRITE_FAILED, { callId, target, cause: error });
      if (this.failsClosed(options)) throw AccessLogWriteFailedError.create({}, { cause: error });
    }
  }

  /**
   * Whether a call of a class with `options` is refused when its record cannot be written. A `credential` read always
   * fails closed, whatever the configuration says: every read of a provider secret is logged (ADR 0494 rule 3).
   */
  failsClosed(options: AccessLoggedOptions): boolean {
    return (
      options.failClosed === true ||
      options.classification === DataClassification.Credential ||
      this.config.failClosed.includes(options.classification)
    );
  }

  /**
   * The principal the call is for when the facet names no field; otherwise the distinct string values of that field
   * on every record among the values, arrays opened one level.
   */
  private subjectsOf(
    options: AccessLoggedOptions,
    actor: Actor,
    values: readonly unknown[],
  ): string[] {
    const field = options.subjects;
    if (field === undefined) return [(actor.onBehalfOf ?? actor).id];
    const found = new Set<string>();
    for (const value of values.flatMap((item) => (Array.isArray(item) ? item : [item]))) {
      if (typeof value !== "object" || value === null) continue;
      const id: unknown = (value as Record<string, unknown>)[field];
      if (typeof id === "string") found.add(id);
    }
    return [...found];
  }
}
