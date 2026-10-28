/**
 * Stackra file contract:
 * Purpose: `LoaderData<I>`, what the loader of route or layout instance `I` hands its page: the awaited return value
 *          with redirects and `Response`s left out and a `RouteResponse` unwrapped to its data.
 * Boundary: a type only; behind the page's `data`, `MetaContext.data`, `useLayoutData` and the layout data spread into
 *           a child's context.
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

/** The page data of route or layout instance `I`. */
export type LoaderData<I> = I extends { loader: (...args: never[]) => infer R }
  ? Unwrapped<Awaited<R>>
  : never;
