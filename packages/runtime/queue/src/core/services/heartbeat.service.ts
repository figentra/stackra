/**
 * Stackra file contract:
 * Purpose: `HeartbeatService`, the sender of a background job's heartbeat (ADR 0184 decision 4): `beat(name)` requests
 *          the URL `HeartbeatConfig.urls` holds for the job `name`, so the Better Stack heartbeat
 *          `@stackra/infra-observability` declared for it stays up while the job runs and opens an incident when it
 *          stops; `during(name, work)` keeps beating while one long piece of work runs. The scheduler beats after each
 *          run of a cron, the outbox relays after each poll they ran under their lock, and the queue worker after each
 *          loop pass and while a job runs.
 * Boundary: a platform service over `HeartbeatConfig`, the `Clock` and the `Logger`. A job with no URL (no secret set:
 *           dev, preview, tests) beats nothing. A beat never throws and never takes longer than `timeout`, its in-call
 *           retries included: a network error, a 408 or a 5xx is tried again up to twice after a short pause while the
 *           timeout leaves room; a 429 or another 4xx is not. A beat that still failed is logged as
 *           `queue.heartbeat_failed` with the job name and the status code or the error's name, never the URL, which
 *           is the credential, at most once per `minInterval` per job (with the count of failures not logged since).
 *           Beats of one job never overlap; after a beat that went through the next one waits `minInterval`, after one
 *           that failed it waits the retry gap (the shorter of `minInterval` and two seconds), so a loop that polls
 *           every second makes one request every few seconds even while the URL is refused. The next allowed beat, the
 *           in-flight set and the failure log's state of each job are the only state it keeps, per process.
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

/** How many times a beat is tried again within one call after a retryable failure. */
const RETRIES = 2;

/** The pause before the first in-call retry, in milliseconds; each later one waits twice the one before. */
const RETRY_PAUSE_MS = 100;

/** The longest wait before the next beat of a job whose last beat failed, in milliseconds. */
const RETRY_GAP_MS = 2000;

/** Why a beat failed: the answered status, or the name of the error it threw. */
type Failure = { readonly status: number } | { readonly error: string };

/** Whether an answered status is worth another try within the call: a 408 or a 5xx. */
const retryableStatus = (status: number): boolean => status === 408 || status >= 500;

/** Resolves `true` after `milliseconds`, or `false` at once when `signal` aborts first. */
function pause(milliseconds: number, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve(false);
      return;
    }
    const done = (waited: boolean) => () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", aborted);
      resolve(waited);
    };
    const aborted = done(false);
    const timer = setTimeout(done(true), milliseconds);
    signal.addEventListener("abort", aborted, { once: true });
  });
}

/**
 * Beats the heartbeat URL of each background job.
 *
 * @example
 * void heartbeats.beat("outbox-relay"); // after a poll; never throws
 * await heartbeats.during("queue-exports", () => runJob()); // beats every minInterval until the job settles
 */
export class HeartbeatService extends Service {
  /** The URL of each job, by job name. */
  private readonly urls: ReadonlyMap<string, string>;

  /** The shortest gap between two beats of one job, in milliseconds. */
  private readonly minInterval: number;

  /** The gap after a failed beat, in milliseconds. */
  private readonly retryGap: number;

  /** How long one beat may take, in milliseconds. */
  private readonly timeout: number;

  /** Reads "now" for the gap between beats. */
  private readonly clock: Clock;

  /** Where a failed beat is reported. */
  private readonly logger: Logger;

  /** When each job may beat next, in epoch milliseconds. */
  private readonly due = new Map<string, number>();

  /** The jobs whose beat is in flight. */
  private readonly sending = new Set<string>();

  /** When each job's failure was last logged, in epoch milliseconds. */
  private readonly logged = new Map<string, number>();

  /** How many failures of each job went unlogged since its last log line. */
  private readonly unlogged = new Map<string, number>();

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
    this.retryGap = Math.min(this.minInterval, RETRY_GAP_MS);
    this.timeout = Duration.toMilliseconds(config.timeout);
    this.clock = clock;
    this.logger = logger;
  }

  /** Whether job `name` has a heartbeat URL, so `beat(name)` sends. */
  has(name: string): boolean {
    return this.urls.has(name);
  }

  /**
   * Beats job `name`'s URL, unless it has none, its last beat is still in flight, or its next beat is not due yet
   * (`minInterval` after one that went through, the retry gap after one that failed).
   *
   * @returns once the beat is answered, abandoned after `timeout` or skipped; it never rejects.
   */
  async beat(name: string): Promise<void> {
    const url = this.urls.get(name);
    if (url === undefined || this.sending.has(name)) return;
    const started = this.clock.now().getTime();
    const due = this.due.get(name);
    if (due !== undefined && started < due) return;
    this.sending.add(name);
    try {
      const failure = await this.send(url);
      if (failure === undefined) {
        this.due.set(name, started + this.minInterval);
        return;
      }
      const now = this.clock.now().getTime();
      this.due.set(name, now + this.retryGap);
      this.report(name, failure, now);
    } finally {
      this.sending.delete(name);
    }
  }

  /**
   * Runs `work` and, while it runs, calls `beat(name)` every `minInterval`, so a job that runs longer than its
   * heartbeat's period keeps it up; the timer stops when `work` settles. A job with no URL just runs `work`.
   *
   * @returns what `work` returns.
   * @throws what `work` throws; a beat never does.
   */
  async during<T>(name: string, work: () => Promise<T>): Promise<T> {
    if (!this.has(name)) return work();
    const timer = setInterval(() => {
      void this.beat(name);
    }, this.minInterval);
    try {
      return await work();
    } finally {
      clearInterval(timer);
    }
  }

  /** Requests `url`, trying a retryable failure again while the timeout leaves room; `undefined` when it went through. */
  private async send(url: string): Promise<Failure | undefined> {
    // One signal for every try: the whole beat, its retries included, ends by `timeout`.
    const signal = AbortSignal.timeout(this.timeout);
    for (let attempt = 0; ; attempt += 1) {
      let failure: Failure;
      let retryable: boolean;
      try {
        // oxlint-disable-next-line no-await-in-loop -- each try waits for the one before it by design
        const response = await fetch(url, { method: "GET", redirect: "error", signal });
        // The body is never read: cancelling it frees the connection.
        // oxlint-disable-next-line no-await-in-loop -- part of the try above
        await response.body?.cancel();
        if (response.ok) return undefined;
        failure = { status: response.status };
        retryable = retryableStatus(response.status);
      } catch (error) {
        // The name only: a fetch error's message or cause may carry the URL.
        failure = { error: error instanceof Error ? error.name : typeof error };
        retryable = !signal.aborted;
      }
      if (!retryable || attempt >= RETRIES) return failure;
      // oxlint-disable-next-line no-await-in-loop -- the pause between two tries
      if (!(await pause(RETRY_PAUSE_MS * 2 ** attempt, signal))) return failure;
    }
  }

  /** Logs `failure` of job `name` at `now`, unless one was logged less than `minInterval` ago: then it only counts. */
  private report(name: string, failure: Failure, now: number): void {
    const logged = this.logged.get(name);
    if (logged !== undefined && now - logged < this.minInterval) {
      this.unlogged.set(name, (this.unlogged.get(name) ?? 0) + 1);
      return;
    }
    const unlogged = this.unlogged.get(name) ?? 0;
    this.logged.set(name, now);
    this.unlogged.delete(name);
    this.logger.warn(QUEUE_LOG_EVENTS.heartbeatFailed, {
      job: name,
      ...failure,
      ...(unlogged === 0 ? {} : { unlogged }),
    });
  }
}
