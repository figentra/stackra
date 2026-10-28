/**
 * Stackra file contract:
 * Purpose: `RouteContextMembers<T>`, the members of a `RouteContext` this package owns: the request's params, query,
 *          path, locale and `Request`; the consumed services through `query` and `action`; the container's config,
 *          platform, captcha verifier and settings reader; and the answers a loader or submit gives (`data`,
 *          `fieldErrors`, `notFound`, `redirect`, `redirectToCanonical`, `navigate`), with `href` and `formData`.
 * Boundary: a type only; `createRouteContext` builds it. `params` and `search` are typed by the route's declared
 *           shapes or path. Members another package owns (the session, the actor) are `RouteServices`'.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17); ADR 0260 (decision 4); ADR 0140 (field errors); ADR 0301
 *                     (decision 5: canonical redirects).
 */
import type { ActionRef, QueryRef, RefInput, RefOutput } from "@stackra/clients";
import type { AnyClass } from "@stackra/container";
import type { FieldErrors } from "@stackra/errors";
import type { Locale } from "@stackra/i18n";
import type { CaptchaVerifier, Platform } from "@stackra/platform/contracts";
import type { SettingsReader } from "@stackra/settings";

import type { HrefParams } from "#core/types/href-params.type";
import type { ParamsOf } from "#core/types/params-of.type";
import type { RouteActionResult } from "#core/types/route-action-result.type";
import type { RouteQueryOptions } from "#core/types/route-query-options.type";
import type { RouteRedirect } from "#core/types/route-redirect.type";
import type { RouteResponse } from "#core/types/route-response.type";
import type { RouteResponseInit } from "#core/types/route-response-init.type";
import type { RouteTarget } from "#core/types/route-target.type";
import type { SearchOf } from "#core/types/search-of.type";

/** The navigation-owned members of the context of route or layout instance `T`. */
export interface RouteContextMembers<T> {
  /** The path params, validated by the route's `params` shape when it declares one. */
  readonly params: ParamsOf<T>;

  /** The query, parsed by the route's `search` shape when it declares one (garbage dropped). */
  readonly search: SearchOf<T>;

  /** The requested path with its query, without the locale prefix's host (`/settings?tab=privacy`). */
  readonly path: string;

  /** The locale of the request's mount. */
  readonly locale: Locale;

  /** The incoming request being answered. */
  readonly request: Request;

  /** The target's capabilities. */
  readonly platform: Platform;

  /** The captcha verifier, for a public form's `submit`. */
  readonly captcha: CaptchaVerifier;

  /** The settings reader. */
  readonly settings: SettingsReader;

  /** A configuration from the container. */
  config: <C extends object>(type: AnyClass<C>) => C;

  /** The localised href of `to` in the request's locale mount. */
  href: (to: RouteTarget, params?: HrefParams) => string;

  /**
   * The answer of a consumed query.
   *
   * @throws ClientError the producer's refusal, or a `TransportError`.
   */
  query: <Q extends QueryRef>(
    query: Q,
    input: RefInput<Q>,
    options?: RouteQueryOptions,
  ) => Promise<RefOutput<Q>>;

  /** Runs a consumed action; a refusal is `{ ok: false, error }`, never a rejection. */
  action: <A extends ActionRef>(
    action: A,
    input: RefInput<A>,
  ) => Promise<RouteActionResult<RefOutput<A>>>;

  /** The submitted form (or JSON body) as one object, dotted names nested (`lines.0.quantity`). */
  formData: () => Promise<Record<string, unknown>>;

  /** `value` with a status and headers. */
  data: <V>(value: V, init?: RouteResponseInit) => RouteResponse<V>;

  /**
   * A 400 that puts each refused path's message on its field: from a failed `validate(...)` or a refusal with field
   * errors.
   *
   * @throws the error itself when it carries no field errors.
   */
  fieldErrors: (error: unknown) => RouteResponse<{ readonly fieldErrors: FieldErrors }>;

  /** A 404 for the error boundary; thrown (`throw ctx.notFound({ code })`). */
  notFound: (
    details?: Readonly<Record<string, unknown>>,
  ) => RouteResponse<Readonly<Record<string, unknown>>>;

  /** A redirect to `to`, returned (or thrown) from a loader or a submit. */
  redirect: (to: RouteTarget, params?: HrefParams) => RouteRedirect;

  /**
   * Answers a permanent redirect when the route's last path param is not `value` (a renamed slug), so only one URL
   * per page is indexed; does nothing when it already is.
   *
   * @throws Response a 301 to the canonical URL.
   */
  redirectToCanonical: (value: string) => void;

  /** Leaves for `to`: an outside URL with `{ external: true }`, else a redirect inside the app. */
  navigate: (to: RouteTarget, options?: { readonly external?: boolean }) => void;
}
