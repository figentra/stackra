/**
 * Stackra file contract:
 * Purpose: `createApp` of the Worker target: returns the `WorkerApp` whose `fetch` validates the server env, boots the
 *          container from the generated wiring once per isolate (from the first request's bindings, the only place a
 *          Worker sees them), fills the router's typed context through the member's factory and runs the React Router
 *          server build.
 * Boundary: a throw anywhere in `fetch` (a bad env, a failed boot, a render error the router did not handle) is
 *           reported once and answered with the static crash page: 500, `text/html`, `no-store`. Nothing a request
 *           sends can crash the isolate. A failed boot is retried by the next request, not cached. The router runs in
 *           production mode, so an error's stack never reaches a response.
 * Runtime: worker
 * Governing contract: ADR 0295 (decisions 7 and 8); ADR 0297 (web runtime on Workers); ADR 0232 (decision 8).
 */
import type { Wiring } from "@stackra/container";
import type { ErrorReporter } from "@stackra/errors/contracts";
import { createRequestHandler } from "react-router";

import { ConsoleErrorReporterDriver } from "#core/drivers/console-error-reporter.driver";
import { bootApp } from "#core/functions/boot-app.function";
import type { AppSections } from "#core/types/app-sections.type";
import type { BootedApp } from "#core/types/booted-app.type";
import type { WorkerApp } from "#worker/types/worker-app.type";
import type { WorkerAppOptions } from "#worker/types/worker-app-options.type";

/**
 * The Worker app of `wiring`.
 *
 * @example
 * export const app = await createApp(wiring, {
 *   env: serverEnv,
 *   build: () => import("virtual:react-router/server-build"),
 *   context: routerContext,
 *   crashPage: CRASH_PAGE,
 * });
 */
export function createApp<E>(
  wiring: Wiring & AppSections,
  options: WorkerAppOptions<E>,
): Promise<WorkerApp> {
  const handle = createRequestHandler(options.build);
  const fallback: ErrorReporter = new ConsoleErrorReporterDriver();
  let booting: Promise<BootedApp> | undefined;

  /** The booted app of this isolate; a rejected boot is forgotten so the next request retries it. */
  const boot = (bindings: Readonly<Record<string, unknown>>): Promise<BootedApp> =>
    (booting ??= bootApp(wiring, { env: bindings }).catch((error: unknown) => {
      booting = undefined;
      throw error;
    }));

  const app: WorkerApp = {
    async fetch(request, raw, ctx) {
      let reporter = fallback;
      try {
        const env = options.env(raw);
        const booted = await boot((raw ?? {}) as Readonly<Record<string, unknown>>);
        reporter = booted.reporter;
        const context = options.context({
          request,
          env,
          ctx,
          container: booted.container.forRequest(),
          reporter,
        });
        return await handle(request, context);
      } catch (error) {
        reporter.report(error);
        return new Response(options.crashPage, {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
        });
      }
    },
  };
  return Promise.resolve(app);
}
