/**
 * Stackra file contract:
 * Purpose: `createApp` of the server target: boots the member's root module from the generated wiring and
 *          `process.env`, and returns the `ServerApp` the generated Encore app imports. It owns boot order, readiness,
 *          drain, shutdown and the signal handling: SIGTERM or SIGINT drains, closes and exits 0 (1 when shutdown
 *          fails, after reporting it). Once the container is ready it awaits the member's `#stackra/boot` (when given)
 *          with the process's `DATABASE_URL` and a shutdown signal that `close()` aborts after the drain.
 *          `handlers.guard` runs the contributed `RequestGuard`s on an inbound request.
 * Boundary: no HTTP server of its own: Encore (generated into `.stackra/encore`) serves, and reaches the member only
 *           through `handlers`. A boot error rejects, so the entry's top-level await fails the process. The outbox
 *           flush and every other shutdown step are each package's `onApplicationShutdown`, run by `close()`.
 * Runtime: node
 * Governing contract: ADR 0295 (decisions 7 to 9); ADR 0263 (decisions 1, 5 and 12); ADR 0124; ADR 0143 as amended
 *                     by 0263 (lifecycle); ADR 0014 (decision 5: the runtime provides the connection); ADR 0260
 *                     (decision 4: subscribers and relays receive once boot connects them); ADR 0457 (request guards).
 */
import type { AnyClass, ModuleClass } from "@stackra/container";

import { bootApp } from "#core/functions/boot-app.function";
import { RequestGuard } from "#server/bases/request-guard.base";
import { answerProbe } from "#server/functions/answer-probe.function";
import { AppDrainingError } from "#server/errors/app-draining.error";
import type { ServerApp } from "#server/types/server-app.type";
import type { ServerAppOptions } from "#server/types/server-app-options.type";
import type { ServerHandlers } from "#server/types/server-handlers.type";

/** The signals that stop a server member. */
const STOP_SIGNALS = ["SIGTERM", "SIGINT"] as const;

/**
 * Boots `root` and returns its server app.
 *
 * @throws ConfigInvalidError or UnresolvedPortError (as a rejection) when boot fails.
 * @example
 * export const app = await createApp(CommerceModule, { wiring, boot });
 */
export async function createApp(root: ModuleClass, options: ServerAppOptions): Promise<ServerApp> {
  const { container, reporter, wiring } = await bootApp(options.wiring, {
    roots: [root],
    env: process.env,
  });
  const shutdown = new AbortController();
  // An empty url only matters to a boot that connects the database, whose driver then refuses it.
  await options.boot?.(container, {
    url: process.env["DATABASE_URL"] ?? "",
    signal: shutdown.signal,
  });

  const byKind = new Map<string, AnyClass[]>();
  for (const binding of wiring.bindings ?? [])
    if (binding.kind !== undefined)
      byKind.set(binding.kind, [...(byKind.get(binding.kind) ?? []), binding.provide]);

  const inFlight = new Set<Promise<void>>();
  let draining: Promise<void> | undefined;
  let closing: Promise<void> | undefined;

  const handlers: ServerHandlers = {
    byKind,
    run(call) {
      if (draining !== undefined) return Promise.reject(AppDrainingError.create());
      const result = Promise.resolve().then(() => call(container.forRequest()));
      // A settled marker, so drain waits for the call without seeing its rejection.
      const settled = result.then(
        () => undefined,
        () => undefined,
      );
      inFlight.add(settled);
      void settled.then(() => inFlight.delete(settled));
      return result;
    },
    async guard(request, scoped) {
      // Array#sort is stable, so guards of equal order keep wiring order.
      const guards = scoped.getAll(RequestGuard).sort((a, b) => a.order - b.order);
      for (const guard of guards) await guard.check(request);
    },
  };

  const drain = (): Promise<void> =>
    (draining ??= (async () => {
      while (inFlight.size > 0) await Promise.all(inFlight);
    })());

  const onSignal = (): void => {
    close().then(
      () => process.exit(0),
      (error: unknown) => {
        reporter.report(error);
        process.exit(1);
      },
    );
  };

  const close = (): Promise<void> =>
    (closing ??= (async () => {
      for (const signal of STOP_SIGNALS) process.off(signal, onSignal);
      await drain();
      shutdown.abort();
      await container.close();
    })());

  for (const signal of STOP_SIGNALS) process.once(signal, onSignal);

  const ready = (): boolean => draining === undefined;
  const indicators = options.health ?? [];

  return {
    key: wiring.member,
    ready,
    probe: (method, path) => answerProbe(method, path, { alive: ready, indicators }),
    drain,
    close,
    handlers,
  };
}
