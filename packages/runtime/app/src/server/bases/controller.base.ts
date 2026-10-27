/**
 * Stackra file contract:
 * Purpose: `Controller`, the kind base of a raw endpoint that is not an action (`/api/auth/*`, a stream): `extends
 *          Controller({ path })` in a module's `raw/` group, with one `handle(request)` that answers a Fetch
 *          `Response`. The interface of the same name is its instance side.
 * Boundary: a service member only (0130 decision 3). The kind and the path are recorded in the kind registry; gen
 *           writes the raw Encore adapter that calls `handle` through `ServerApp.handlers.run`. An inbound webhook is
 *           a `WebhookEvent`, never a controller. The `~kind` brand is type-only; the base keeps no state.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 16 and 25; the `@Controller` decorator is retired); registry v3.1 A13
 *                     (Controller lives in `@stackra/app/server`); http-conventions rule (raw endpoints).
 */
import { createKind } from "@stackra/container";

import type { ControllerClass } from "#server/types/controller-class.type";
import type { ControllerOptions } from "#server/types/controller-options.type";

/** The instance side of every controller; `handle` is abstract, so a controller needs no `override`. */
abstract class ControllerBase {
  /** Type-only kind brand, so a class of another kind cannot stand in for a controller. */
  declare readonly "~kind": "controller";

  /** Answers one raw request; the adapter has already authenticated it unless the endpoint opted out. */
  abstract handle(request: Request): Promise<Response>;
}

/** A controller instance. */
export type Controller = ControllerBase;

/**
 * The controller kind base.
 *
 * @example
 * export class AuthCallbackController extends Controller({ path: "/api/auth/callback" }) {
 *   constructor(private readonly sessions: SessionService) {
 *     super();
 *   }
 *
 *   async handle(request: Request): Promise<Response> {
 *     return this.sessions.complete(new URL(request.url));
 *   }
 * }
 */
export const Controller = createKind(
  "controller",
  // The runtime base keeps no state of the kind's own (0294 d25).
  ControllerBase,
) as (options: ControllerOptions) => ControllerClass;
