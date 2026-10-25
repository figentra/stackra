/**
 * Stackra file contract:
 * Purpose: `WorkerAppOptions<E>`, the second argument of `createApp` from `@stackra/app/worker`: the env validator,
 *          the React Router server build, the typed-context factory and the static crash page.
 * Boundary: a type only; gen writes the values in `.stackra/entry/worker.ts`. It also declares React Router's
 *           middleware mode (`v8_middleware`), which gen's router config enables, so the context type matches.
 * Runtime: worker
 * Governing contract: ADR 0295 (decisions 7 and 8); ADR 0297 (web runtime on Workers).
 */
import type { RouterContextProvider, ServerBuild } from "react-router";

import type { WorkerRequest } from "#worker/types/worker-request.type";

declare module "react-router" {
  /** Middleware mode, which the generated React Router config turns on: the load context is a typed provider. */
  interface Future {
    /** React Router's middleware future flag. */
    v8_middleware: true;
  }
}

/** The options of the Worker `createApp`. */
export interface WorkerAppOptions<E> {
  /** Validates the raw bindings into the server env (`serverEnv` from `#stackra/env`); throws naming a bad variable. */
  readonly env: (raw: unknown) => E;

  /** Imports the React Router server build (`virtual:react-router/server-build`). */
  readonly build: () => Promise<ServerBuild>;

  /** Fills the router's typed context for one request; called after the env has validated. */
  readonly context: (request: WorkerRequest<E>) => RouterContextProvider;

  /** The static page a request that throws is answered with (500, never cached). */
  readonly crashPage: string;
}
