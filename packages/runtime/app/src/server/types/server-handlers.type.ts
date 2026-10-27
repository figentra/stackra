/**
 * Stackra file contract:
 * Purpose: `ServerHandlers`, the `handlers` of a `ServerApp`: what the generated Encore adapters reach the member
 *          through. The classes they expose by kind code, and `run`, which gives one call its request container and
 *          counts it until it settles, so `drain()` can wait for it, and `guard`, which runs every contributed
 *          `RequestGuard` on an inbound request.
 * Boundary: a type only. The adapters are generated (ADR 0091, 0124); a service never calls these itself.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 8); ADR 0263 (decision 5: request lifetime); ADR 0124; ADR 0457.
 */
import type { AnyClass, Container } from "@stackra/container";

/** The handler side of a server app. */
export interface ServerHandlers {
  /** The bound classes by kind code (`action`, `query`, `controller`, `listener`, ...), in wiring order. */
  readonly byKind: ReadonlyMap<string, readonly AnyClass[]>;

  /**
   * Runs one call with a fresh request container and tracks it until it settles.
   *
   * @throws AppDrainingError (as a rejection) once the app drains.
   */
  run<T>(call: (container: Container) => T | Promise<T>): Promise<T>;

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
  guard(request: Request, container: Container): Promise<void>;
}
