/**
 * Stackra file contract:
 * Purpose: `SubmitData<I>`, what the `submit` of route instance `I` hands back to its page: the awaited return value
 *          with redirects and `Response`s left out and a `RouteResponse` (field errors, `ctx.data`) unwrapped.
 * Boundary: a type only; behind `useSubmit<typeof X>().data`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16).
 */
import type { RouteRedirect } from "#core/types/route-redirect.type";
import type { RouteResponse } from "#core/types/route-response.type";

/** One possible return value as the page sees it. */
type Unwrapped<R> = R extends RouteRedirect
  ? never
  : R extends RouteResponse<infer V>
    ? V
    : R extends Response
      ? never
      : R;

/** The submit result of route instance `I`. */
export type SubmitData<I> = I extends { submit(...args: never[]): infer R }
  ? Unwrapped<Awaited<R>>
  : never;
