/**
 * Stackra file contract:
 * Purpose: `createRouteContext(input)`, the one builder of a `RouteContext`, used by every adapter (React Router, React
 *          Navigation, the testing helper): params and query checked against the route's shapes, the mount's locale,
 *          the caller behind `query` and `action`, the container behind `config`, `platform`, `captcha` and
 *          `settings`, the answers (`data`, `fieldErrors`, `notFound`, `redirect`, `redirectToCanonical`, `navigate`),
 *          then the layout's data, the contributed parts and the extra members, later winning.
 * Boundary: invalid params are a 404 (thrown `RouteResponse`, code `route_params_invalid`); invalid query entries are
 *           dropped and the rest kept. Container members are read lazily, so a route that never uses one needs no
 *           binding; reading one without a container throws a `TypeError` naming it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17); ADR 0260 (decision 4); ADR 0301 (decision 5); ADR 0297.
 */
import type { ActionRef, ClientError, QueryRef, RefInput } from "@stackra/clients";
import { kindOf } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { isRefusal } from "@stackra/errors";
import { I18nConfig, Locale } from "@stackra/i18n";
import { CaptchaVerifier, Platform } from "@stackra/platform/contracts";
import { canonicalRedirect, localePath } from "@stackra/seo";
import { SettingsReader } from "@stackra/settings";
import { validate } from "@stackra/validation";

import { RouteCaller } from "#contracts/index";
import type { Route } from "#core/bases/route.base";
import { ROUTE_CONTEXT_PARTS } from "#core/constants/route-context-parts.constant";
import { createRouteRedirect } from "#core/functions/create-route-redirect.function";
import { data } from "#core/functions/data.function";
import { fieldErrorsOf } from "#core/functions/field-errors-of.function";
import { fillPath } from "#core/functions/fill-path.function";
import { localeOfPath } from "#core/functions/locale-of-path.function";
import { parseSearch } from "#core/functions/parse-search.function";
import { readFormData } from "#core/functions/read-form-data.function";
import { resolveHref } from "#core/functions/resolve-href.function";
import type { HrefParams } from "#core/types/href-params.type";
import type { RouteContext } from "#core/types/route-context.type";
import type { RouteContextInput } from "#core/types/route-context-input.type";
import type { RouteQueryOptions } from "#core/types/route-query-options.type";
import type { RouteTarget } from "#core/types/route-target.type";

/** Defines `values` on `target`, replacing any member of the same name (a lazy getter included). */
function assignOver(target: object, values: object): void {
  for (const [name, value] of Object.entries(values))
    Object.defineProperty(target, name, {
      value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
}

/**
 * The context of one load or submit of `input.type`.
 *
 * @throws RouteResponse a 404 when the params break the route's `params` shape.
 * @example
 * const ctx = createRouteContext({ type: SettingsRoute, request, params, container });
 * const data = await container.get(SettingsRoute).loader(ctx);
 */
export function createRouteContext(input: RouteContextInput): RouteContext<Route> {
  const { type, request, container } = input;
  const options = kindOf(type)?.options ?? {};
  const url = new URL(request.url);
  const i18n = container?.has(I18nConfig) === true ? container.get(I18nConfig) : undefined;
  const locale =
    input.locale ?? (i18n === undefined ? Locale.En : localeOfPath(url.pathname, i18n));
  const mount = i18n === undefined ? undefined : { locale, i18n };
  const rawParams = input.params ?? {};
  const paramsShape = options["params"];
  let params: object = rawParams;
  if (typeof paramsShape === "function") {
    const parsed = validate(paramsShape as AnyClass, rawParams);
    if (!parsed.success) throw data({ code: "route_params_invalid" }, { status: 404 });
    params = parsed.data;
  }
  const fromContainer = <T extends object>(token: AnyClass<T>, member: string): T => {
    if (container === undefined)
      throw new TypeError(`ctx.${member} needs the container; this adapter was given none`);
    return container.get(token);
  };
  const caller = (): Pick<RouteCaller, "query" | "action"> => {
    if (input.caller !== undefined) return input.caller;
    if (container?.has(RouteCaller) === true) return container.get(RouteCaller);
    throw new TypeError("ctx.query and ctx.action need a RouteCaller driver; none is bound");
  };
  let body: Promise<Record<string, unknown>> | undefined;
  const href = (to: RouteTarget, hrefParams?: HrefParams) => resolveHref(to, hrefParams, mount);

  const ctx = {
    params,
    search: parseSearch(url.searchParams, type),
    path: `${url.pathname}${url.search}`,
    locale,
    request,
    config: <C extends object>(token: AnyClass<C>) => fromContainer(token, "config"),
    href,
    query: <Q extends QueryRef>(
      query: Q,
      queryInput: RefInput<Q>,
      queryOptions?: RouteQueryOptions,
    ) => caller().query(query, queryInput, { ...queryOptions, signal: request.signal }),
    action: async <A extends ActionRef>(action: A, actionInput: RefInput<A>) => {
      try {
        const result = await caller().action(action, actionInput, { signal: request.signal });
        return result.queued
          ? ({ ok: true, queued: true } as const)
          : ({ ok: true, queued: false, data: result.data } as const);
      } catch (error) {
        if (isRefusal(error)) return { ok: false, error: error as ClientError } as const;
        throw error;
      }
    },
    formData: () => (body ??= readFormData(request)),
    data,
    fieldErrors: (error: unknown) => data({ fieldErrors: fieldErrorsOf(error) }, { status: 400 }),
    notFound: (details: Readonly<Record<string, unknown>> = {}) => data(details, { status: 404 }),
    redirect: (to: RouteTarget, redirectParams?: HrefParams) =>
      createRouteRedirect(to, redirectParams),
    redirectToCanonical: (value: string) => {
      const pattern = typeof options["path"] === "string" ? options["path"] : "";
      const name = [...pattern.matchAll(/:([A-Za-z0-9_]+)/g)].at(-1)?.[1];
      if (name === undefined)
        throw new TypeError("redirectToCanonical needs a route whose path names a param");
      if ((rawParams as Record<string, unknown>)[name] === value) return;
      const path = fillPath(pattern, { ...rawParams, [name]: value });
      const redirect = canonicalRedirect(
        url,
        mount === undefined ? path : localePath(path, mount.locale, mount.i18n),
      );
      if (redirect !== null) throw redirect;
    },
    navigate: (to: RouteTarget, navigateOptions: { readonly external?: boolean } = {}) => {
      const external = navigateOptions.external === true;
      const target = href(to);
      if (input.navigate !== undefined) input.navigate(target, { external });
      else if (external) globalThis.location.assign(target);
      else throw createRouteRedirect(to);
    },
  };
  Object.defineProperties(ctx, {
    platform: {
      get: () => fromContainer(Platform, "platform"),
      configurable: true,
      enumerable: true,
    },
    captcha: {
      get: () => fromContainer(CaptchaVerifier, "captcha"),
      configurable: true,
      enumerable: true,
    },
    settings: {
      get: () => fromContainer(SettingsReader, "settings"),
      configurable: true,
      enumerable: true,
    },
  });
  if (typeof input.layoutData === "object" && input.layoutData !== null)
    assignOver(ctx, input.layoutData);
  for (const part of ROUTE_CONTEXT_PARTS) assignOver(ctx, part({ request, container }));
  if (input.members !== undefined) assignOver(ctx, input.members);
  return ctx as unknown as RouteContext<Route>;
}
