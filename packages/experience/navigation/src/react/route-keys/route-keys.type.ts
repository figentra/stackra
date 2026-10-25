/**
 * Stackra file contract:
 * Purpose: `RouteKeys`, the typed React Router context keys of one request that the adapters read: the booted
 *          container, the member's env, the request's public clients factory and the error reporter (the web member's
 *          generated `routeKeys`).
 * Boundary: a type only; the keys are made by the member's generated context file with React Router's
 *           `createContext`, and filled per request by its entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0297 (web runtime on Workers); ADR 0165 (React Router 7 framework mode).
 */
import type { PublicClients } from "@stackra/clients/server";
import type { Container } from "@stackra/container";
import type { ErrorReporter } from "@stackra/errors/contracts";
import type { RouterContext } from "react-router";

/** The context keys the route adapters read. */
export interface RouteKeys {
  /** The booted container. */
  readonly container: RouterContext<Container>;

  /** The member's validated env, set as `ctx.env`. */
  readonly env?: RouterContext<object>;

  /** The request's public clients, behind `ctx.query` and `ctx.action`. */
  readonly clients?: RouterContext<(...args: never[]) => Pick<PublicClients, "query" | "action">>;

  /** The error reporter; an unexpected loader or submit error reaches it once. */
  readonly reporter?: RouterContext<ErrorReporter>;
}
