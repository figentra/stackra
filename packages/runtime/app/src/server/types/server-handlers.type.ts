/**
 * Stackra file contract:
 * Purpose: `ServerHandlers`, the `handlers` of a `ServerApp`: what the generated Encore adapters reach the member
 *          through. The classes they expose by kind code, and `run`, which admits one call through the load-shedding
 *          bulkhead (a cron run skips it), gives it its request container and counts it until it settles, so `drain()` can wait for it,
 *          `guard`, which runs every contributed `RequestGuard` on an inbound request, and `shed`, which answers a call
 *          `run` turned away (overloaded or draining) as 503.
 * Boundary: a type only. The adapters are generated (ADR 0091, 0124); a service never calls these itself.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 8); ADR 0263 (decision 5: request lifetime); ADR 0124; ADR 0457; ADR 0140
 *                     (`Unavailable` is 503); STA-1467 (load shedding).
 */
import type { AnyClass, Container } from "@stackra/container";

import type { ServerRunOptions } from "#server/types/server-run-options.type";

/** The handler side of a server app. */
export interface ServerHandlers {
  /** The bound classes by kind code (`action`, `query`, `controller`, `listener`, ...), in wiring order. */
  readonly byKind: ReadonlyMap<string, readonly AnyClass[]>;

  /**
   * Runs one call with a fresh request container and tracks it until it settles. With `HttpConfig.maxConcurrentCalls`
   * above 0, at most that many calls run at once; the next `maxQueuedCalls` wait in arrival order for at most
   * `maxQueueWaitMs`, and any other call is turned away before it starts. With `options.shed` `false` (a cron run) the
   * call skips the bulkhead and starts at once.
   *
   * @throws AppDrainingError (as a rejection) once the app drains.
   * @throws AppOverloadedError (as a rejection) when the call is turned away: the bulkhead and its queue are full, or
   *         no place came free within the wait. Never with `options.shed` `false`.
   * @example
   * await app.handlers.run((container) => container.get(SchedulerService).fire(key), { shed: false });
   */
  run: <T>(
    call: (container: Container) => T | Promise<T>,
    options?: ServerRunOptions,
  ) => Promise<T>;

  /**
   * Runs every `RequestGuard` the booted modules contribute on `request`, lowest `order` first, one after another,
   * resolved from `container` (the call's request container). Resolves when every guard let it through.
   *
   * @throws Refusal (as a rejection) from the first guard that refuses; the later guards do not run.
   * @example
   * await app.handlers.run(async (container) => {
   *   await app.handlers.guard(request, container);
   *   return container.get(CancelOrderAction).handle(input);
   * });
   */
  guard: (request: Request, container: Container) => Promise<void>;

  /**
   * Answers `request` when `run` turned it away: an `AppOverloadedError` or `AppDrainingError` becomes 503 with the
   * refusal's envelope, `Retry-After` (whole seconds) when the refusal names a wait, `Cache-Control: no-store` and the
   * CORS headers of the bound `CorsConfig`, so a browser reads the 503 instead of a CORS failure.
   *
   * @throws the given error (as a rejection) when it is anything else, so it propagates as before.
   * @example
   * return app.handlers.run((container) => handle(request, container)).catch((error: unknown) => app.handlers.shed(request, error));
   */
  shed: (request: Request, error: unknown) => Promise<Response>;
}
