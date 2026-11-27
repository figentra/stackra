/**
 * Stackra file contract:
 * Purpose: `ServerRunOptions`, the second argument of `ServerHandlers.run`: whether the call passes the load-shedding
 *          bulkhead. A cron run says `shed: false`: Encore never retries a failed CronJob invocation and a fired
 *          action moves no watermark, so a cron run turned away would be lost for good (STA-1467).
 * Boundary: a type only. The generated adapters pass it; a service never calls `run` itself.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 8); ADR 0148 (decision 6: the cron run); STA-1467 (load shedding).
 */

/** How `ServerHandlers.run` admits one call. */
export interface ServerRunOptions {
  /**
   * `false` skips the bulkhead: the call starts at once, however many are in flight, and is never turned away as
   * overloaded. Still counted in flight (a drain waits for it) and still refused while the app drains. Default `true`.
   */
  readonly shed?: boolean;
}
