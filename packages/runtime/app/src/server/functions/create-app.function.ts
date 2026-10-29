/**
 * Stackra file contract:
 * Purpose: `createApp` of the server target: boots the member's root module from the generated wiring and
 *          `process.env`, and returns the `ServerApp` the generated Encore app imports. It owns boot order, readiness,
 *          drain, shutdown and the signal handling: SIGTERM or SIGINT drains, closes and exits 0 (1 when shutdown
 *          fails, after reporting it). Once the container is ready it awaits the member's `#stackra/boot` (when given)
 *          with a shutdown signal that `close()` aborts after the drain; the boot takes its database url from the
 *          service's Encore database, so no url passes here (STA-1401).
 *          `handlers.guard` runs the contributed `RequestGuard`s on an inbound request. When a `Tracer` is bound, each
 *          call runs inside `Tracer.continueTrace` with a carrier `handlers.guard` fills once the guards pass (the
 *          request's W3C `traceparent` and the edge's request id), so the call's spans join the caller's trace and
 *          carry `requestId` (ADR 0184 decision 1, STA-1572). `/readyz` runs the given
 *          `health` indicators plus every `HealthIndicator` the container binds (each package's health driver),
 *          resolved once after boot.
 * Boundary: no HTTP server of its own: Encore (generated into `.stackra/encore`) serves, and reaches the member only
 *           through `handlers`. A boot error rejects, so the entry's top-level await fails the process. The outbox
 *           flush and every other shutdown step are each package's `onApplicationShutdown`, run by `close()`.
 * Runtime: node
 * Governing contract: ADR 0295 (decisions 7 to 9); ADR 0263 (decisions 1, 5 and 12); ADR 0124; ADR 0143 as amended
 *                     by 0263 (lifecycle); ADR 0014 (decision 5: the runtime provides the connection); ADR 0260
 *                     (decision 4: subscribers and relays receive once boot connects them); ADR 0457 (request guards);
 *                     ADR 0473 (the migrate and seed CLIs connect with `directDatabaseUrl`, never through here).
 */
import type { AnyClass, ModuleClass } from "@stackra/container";
import { HealthIndicator, Tracer } from "@stackra/contracts";
import type { TraceCarrier } from "@stackra/contracts";

import { EdgeHeader } from "#contracts/enums/edge-header.enum";
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
  await options.boot?.(container, { signal: shutdown.signal });

  const byKind = new Map<string, AnyClass[]>();
  for (const binding of wiring.bindings ?? [])
    if (binding.kind !== undefined)
      byKind.set(binding.kind, [...(byKind.get(binding.kind) ?? []), binding.provide]);

  const tracer = container.has(Tracer) ? container.get(Tracer) : undefined;
  // The trace carrier of each call, by its request container, which `guard` receives.
  const carriers = new WeakMap<object, TraceCarrier>();

  const inFlight = new Set<Promise<void>>();
  let draining: Promise<void> | undefined;
  let closing: Promise<void> | undefined;

  const handlers: ServerHandlers = {
    byKind,
    run(call) {
      if (draining !== undefined) return Promise.reject(AppDrainingError.create());
      const result = Promise.resolve().then(() => {
        const scoped = container.forRequest();
        if (tracer === undefined) return call(scoped);
        const carrier: TraceCarrier = {};
        carriers.set(scoped, carrier);
        return tracer.continueTrace(carrier, () => Promise.resolve().then(() => call(scoped)));
      });
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
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      const guards = scoped.getAll(RequestGuard).sort((a, b) => a.order - b.order);
      for (const guard of guards) await guard.check(request);
      const carrier = carriers.get(scoped);
      if (carrier === undefined) return;
      const traceparent = request.headers.get("traceparent");
      const requestId = request.headers.get(EdgeHeader.RequestId);
      if (traceparent !== null) carrier.traceparent = traceparent;
      if (requestId !== null) carrier.requestId = requestId;
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
  // A Set, so an indicator both given and bound runs once.
  const indicators = [
    ...new Set([...(options.health ?? []), ...container.getAll(HealthIndicator)]),
  ];

  return {
    key: wiring.member,
    ready,
    probe: (method, path) => answerProbe(method, path, { alive: ready, indicators }),
    drain,
    close,
    handlers,
  };
}
