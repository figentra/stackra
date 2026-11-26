/**
 * Stackra file contract:
 * Purpose: `HeartbeatService`, the sender of a background job's heartbeat (ADR 0184 decision 4): `beat(name)` requests
 *          the URL `HeartbeatConfig.urls` holds for the job `name`, so the Better Stack heartbeat
 *          `@stackra/infra-observability` declared for it stays up while the job runs and opens an incident when it
 *          stops. The scheduler beats after each run of a cron, the outbox relays after each poll and the queue worker
 *          after each loop.
 * Boundary: a platform service over `HeartbeatConfig`, the `Clock` and the `Logger`. A job with no URL (no secret set:
 *           dev, preview, tests) beats nothing. A beat never throws and never takes longer than `timeout`: a failed, refused
 *           or slow beat is logged as `queue.heartbeat_failed` with the job name and the status code or the error's name,
 *           never the URL, which is the credential. Beats of one job are at least `minInterval` apart and never
 *           overlap, so a loop that polls every second makes one request every few seconds; a failed beat does not count,
 *           so the next call tries again. The last beat of each job is the one state it keeps, per process.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 4: crons, relays and workers send heartbeats; enforcement: the heartbeat check
 *                     runs in the scheduler); ADR 0185 (decision 1: Better Stack runs on-call); ADR 0147 (structured log
 *                     events, no secret in a log).
 */
import { Service } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import type { Clock, Logger } from "@stackra/contracts";

import type { HeartbeatConfig } from "#config/heartbeat.config";
import { QUEUE_LOG_EVENTS } from "#core/constants/queue-log-events.constant";
import { heartbeatUrls } from "#core/functions/heartbeat-urls.function";

/**
 * Beats the heartbeat URL of each background job.
 *
 * @example
 * void heartbeats.beat("outbox-relay"); // after a poll; never throws
 */
export class HeartbeatService extends Service {
  /** The URL of each job, by job name. */
  private readonly urls: ReadonlyMap<string, string>;

  /** The shortest gap between two beats of one job, in milliseconds. */
  private readonly minInterval: number;

  /** How long one beat may take, in milliseconds. */
  private readonly timeout: number;

  /** Reads "now" for the gap between beats. */
  private readonly clock: Clock;

  /** Where a failed beat is reported. */
  private readonly logger: Logger;

  /** When each job last beat, in epoch milliseconds. */
  private readonly last = new Map<string, number>();

  /** The jobs whose beat is in flight. */
  private readonly sending = new Set<string>();

  /**
   * @param config - the URLs, the gap between beats and the timeout of one.
   * @param clock - the time source of the gap.
   * @param logger - reports a failed beat.
   */
  constructor(config: HeartbeatConfig, clock: Clock, logger: Logger) {
    super();
    // The schema already refused a malformed value; this only reads it.
    this.urls = heartbeatUrls(config.urls) ?? new Map();
    this.minInterval = Duration.toMilliseconds(config.minInterval);
    this.timeout = Duration.toMilliseconds(config.timeout);
    this.clock = clock;
    this.logger = logger;
  }

  /** Whether job `name` has a heartbeat URL, so `beat(name)` sends. */
  has(name: string): boolean {
    return this.urls.has(name);
  }

  /**
   * Beats job `name`'s URL, unless it has none, beat less than `minInterval` ago, or its last beat is still in flight.
   *
   * @returns once the beat is answered, abandoned after `timeout` or skipped; it never rejects.
   */
  async beat(name: string): Promise<void> {
    const url = this.urls.get(name);
    if (url === undefined || this.sending.has(name)) return;
    const now = this.clock.now().getTime();
    const last = this.last.get(name);
    if (last !== undefined && now - last < this.minInterval) return;
    this.sending.add(name);
    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "error",
        signal: AbortSignal.timeout(this.timeout),
      });
      // The body is never read: cancelling it frees the connection.
      await response.body?.cancel();
      if (response.ok) this.last.set(name, now);
      else
        this.logger.warn(QUEUE_LOG_EVENTS.heartbeatFailed, { job: name, status: response.status });
    } catch (error) {
      // The name only: a fetch error's message or cause may carry the URL.
      this.logger.warn(QUEUE_LOG_EVENTS.heartbeatFailed, {
        job: name,
        error: error instanceof Error ? error.name : typeof error,
      });
    } finally {
      this.sending.delete(name);
    }
  }
}
