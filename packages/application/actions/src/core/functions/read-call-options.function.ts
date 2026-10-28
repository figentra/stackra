/**
 * Stackra file contract:
 * Purpose: `readCallOptions`, the checks `Action({...})` and `Query({...})` share: the key's shape, the actors, the
 *          version, the area, the endpoint override (a query reads with `GET`, an action never does), the
 *          interceptors, an explicit `tool: true` without an agent actor, `analytics` (`true` or an
 *          `AnalyticsEvent` class), and `queryBudget` (a whole number from 1).
 * Boundary: runs once per declared class, when its module loads, and throws a `TypeError` or `RangeError` naming the
 *           option; gen repeats the same checks from source (STA-340). Returns the shared fields with their defaults.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 21); ADR 0305 (rules 28 and 30: `tool_without_agent_actor`); ADR 0138
 *                     (as amended); STA-1512 (`analytics`); STA-1400 (`queryBudget`).
 */
import { type AnyClass, kindOf } from "@stackra/container";
import { ActorKind, ApiArea, Enum, HttpMethod } from "@stackra/contracts";

import { Interceptor } from "#core/bases/interceptor.base";
import { CALL_KEY_PATTERN } from "#core/constants/call-key-pattern.constant";
import type { CallAnalytics } from "#core/types/call-analytics.type";
import type { EndpointOptions } from "#core/types/endpoint-options.type";

/** The options both kinds share, as written. */
interface SharedOptions {
  readonly key: string;
  readonly actors: readonly ActorKind[];
  readonly version?: number;
  readonly area?: ApiArea;
  readonly interceptors?: readonly AnyClass<Interceptor>[];
  readonly endpoint?: EndpointOptions | false;
  readonly tool?: boolean;
  readonly analytics?: CallAnalytics;
  readonly queryBudget?: number;
}

/**
 * Checks the shared options of an action (`base` is `"Action"`) or a query (`"Query"`).
 *
 * @returns the version, area and interceptors with their defaults applied.
 * @throws TypeError for a malformed key, actor list, endpoint or interceptor, or `tool: true` without an agent actor.
 * @throws RangeError for an unknown actor kind, area or method, or a version or query budget below 1.
 * @example
 * const shared = readCallOptions("Action", options); // { version: 1, area: "app", interceptors: [] }
 */
export function readCallOptions(
  base: "Action" | "Query",
  options: SharedOptions,
): {
  version: number;
  area: ApiArea;
  interceptors: readonly AnyClass<Interceptor>[];
} {
  if (typeof options?.key !== "string" || !CALL_KEY_PATTERN.test(options.key))
    throw new TypeError(
      `${base}({ key }) needs "<model>.<verb>" in snake_case, such as "order.create", got ${JSON.stringify(options?.key)}`,
    );
  if (!Array.isArray(options.actors) || options.actors.length === 0)
    throw new TypeError(`${base}({ actors }) needs at least one ActorKind (${options.key})`);
  for (const actor of options.actors)
    if (!Enum.values(ActorKind).includes(actor))
      throw new RangeError(
        `${base}({ actors }) takes ActorKind values, got ${JSON.stringify(actor)}`,
      );
  const version = options.version ?? 1;
  if (!Number.isInteger(version) || version < 1)
    throw new RangeError(`${base}({ version }) must be a whole number from 1, got ${version}`);
  const area = options.area ?? ApiArea.App;
  if (!Enum.values(ApiArea).includes(area))
    throw new RangeError(`${base}({ area }) takes an ApiArea, got ${JSON.stringify(area)}`);
  const { endpoint } = options;
  if (endpoint !== undefined && endpoint !== false) {
    if (!Enum.values(HttpMethod).includes(endpoint.method))
      throw new RangeError(
        `${base}({ endpoint: { method } }) takes an HttpMethod, got ${JSON.stringify(endpoint.method)}`,
      );
    if (typeof endpoint.path !== "string" || !endpoint.path.startsWith("/"))
      throw new TypeError(
        `${base}({ endpoint: { path } }) must start with "/", got ${JSON.stringify(endpoint.path)}`,
      );
    if ((base === "Query") !== (endpoint.method === HttpMethod.Get))
      throw new TypeError(
        base === "Query"
          ? `A query is read with GET, not ${endpoint.method} (${options.key})`
          : `An action changes state, so it is never GET (${options.key})`,
      );
  }
  const interceptors = options.interceptors ?? [];
  for (const type of interceptors)
    if (typeof type !== "function" || !(type.prototype instanceof Interceptor))
      throw new TypeError(
        `${base}({ interceptors }) lists classes that extend Interceptor (${options.key})`,
      );
  if (
    options.tool === true &&
    !options.actors.some((actor) => actor === ActorKind.Agent || actor === ActorKind.ExternalAgent)
  )
    throw new TypeError(
      `${base}({ tool: true }) needs an agent among its actors (${options.key}): tool_without_agent_actor`,
    );
  const { analytics } = options;
  if (
    analytics !== undefined &&
    analytics !== true &&
    kindOf(analytics as unknown as AnyClass)?.kind !== "analytics_event"
  )
    throw new TypeError(
      `${base}({ analytics }) is true or a class that extends AnalyticsEvent (${options.key})`,
    );
  const { queryBudget } = options;
  if (queryBudget !== undefined && (!Number.isSafeInteger(queryBudget) || queryBudget < 1))
    throw new RangeError(
      `${base}({ queryBudget }) must be a whole number from 1, got ${queryBudget} (${options.key})`,
    );
  return { version, area, interceptors: Object.freeze([...interceptors]) };
}
