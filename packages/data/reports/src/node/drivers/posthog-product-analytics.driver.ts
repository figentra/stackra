/**
 * Stackra file contract:
 * Purpose: `PosthogProductAnalyticsDriver`, the `posthog` driver of the `ProductAnalytics` port: it checks a funnel,
 *          retention or cohort query, posts it as a structured query to PostHog's query API
 *          (`POST <host>/api/projects/<projectId>/query/`) narrowed to the caller's scope, and returns counts of people.
 * Boundary: implements the port only; plain `fetch`, no vendor SDK. The personal API key is read at call time from the
 *           runtime's `SecretStore` under `reports.posthog.keySecret` (ADR 0173) and is never logged, kept or put in an
 *           error. Scope isolation: the call's `scopeId` (`ContextStorage`) is an exact filter on the event property
 *           `reports.posthog.scopeProperty`, ANDed with every series; outside a scoped call the query is refused,
 *           unless the scope property is `null` (a project holding one scope's events). The events must carry that
 *           property, which the analytics client sets (see README). Buckets fall in the PostHog project's time zone.
 * Runtime: node
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28: PostHog the first driver); ADR 0190 (decision 2);
 *                     ADR 0173 (secrets from the runtime secret store); ADR 0323 (scope isolation); ADR 0142; ADR 0294
 *                     (decisions 16 and 17).
 */
import type { ContextStorage } from "@stackra/actions/contracts";
import type { SecretStore } from "@stackra/config/contracts";
import { Driver } from "@stackra/container";

import { ProductAnalytics } from "#contracts/ports/product-analytics.port";
import type { CohortQuery } from "#contracts/types/cohort-query.type";
import type { CohortResult } from "#contracts/types/cohort-result.type";
import type { FunnelQuery } from "#contracts/types/funnel-query.type";
import type { FunnelResult } from "#contracts/types/funnel-result.type";
import type { RetentionQuery } from "#contracts/types/retention-query.type";
import type { RetentionResult } from "#contracts/types/retention-result.type";
import type { ReportsConfig } from "#node/config/reports.config";
import { ProductAnalyticsScopeMissingError } from "#node/errors/product-analytics-scope-missing.error";
import { ProductAnalyticsUnavailableError } from "#node/errors/product-analytics-unavailable.error";
import { checkProductAnalyticsQuery } from "#node/functions/check-product-analytics-query.function";
import { posthogQueryOf } from "#node/functions/posthog-query-of.function";
import { posthogResultOf } from "#node/functions/posthog-result-of.function";
import type { PosthogScope } from "#node/types/posthog-scope.type";
import type { ProductAnalyticsCall } from "#node/types/product-analytics-call.type";

/** Throws the refusal of an unanswerable query for `reason`. */
function unavailable(reason: string): never {
  throw ProductAnalyticsUnavailableError.create({ driver: "posthog", reason });
}

/**
 * Computes funnels, retention and cohorts on PostHog.
 *
 * @example
 * // runway.yaml: config.reports.posthog: { host: https://eu.posthog.com, projectId: "12345", keySecret: REPORTS_POSTHOG_KEY }
 * // generated wiring: { port: ProductAnalytics, selectedBy: "config:reports.productAnalytics", candidates: { posthog: … }, deps: { posthog: [ReportsConfig, SecretStore, ContextStorage] } }
 */
export class PosthogProductAnalyticsDriver extends Driver(ProductAnalytics) {
  /** The PostHog host, project, key secret name and scope property. */
  private readonly settings: ReportsConfig["posthog"];

  /** Where the key is read from at call time. */
  private readonly secrets: SecretStore;

  /** The running call, for its scope. */
  private readonly storage: ContextStorage;

  /**
   * @param config - the reports configuration (`posthog`).
   * @param secrets - the runtime's secret store.
   * @param storage - the running call's context.
   */
  constructor(config: ReportsConfig, secrets: SecretStore, storage: ContextStorage) {
    super();
    this.settings = config.posthog;
    this.secrets = secrets;
    this.storage = storage;
  }

  /**
   * Implements `ProductAnalytics.funnel`, documented there.
   *
   * @throws ProductAnalyticsQueryInvalidError for a malformed query.
   * @throws ProductAnalyticsScopeMissingError outside a scoped call while isolating by scope.
   * @throws ProductAnalyticsUnavailableError when PostHog is not configured or does not answer.
   */
  async funnel(query: FunnelQuery): Promise<FunnelResult> {
    const call = { kind: "funnel", query } as const;
    return posthogResultOf(call, await this.ask(call));
  }

  /**
   * Implements `ProductAnalytics.retention`, documented there.
   *
   * @throws ProductAnalyticsQueryInvalidError for a malformed query.
   * @throws ProductAnalyticsScopeMissingError outside a scoped call while isolating by scope.
   * @throws ProductAnalyticsUnavailableError when PostHog is not configured or does not answer.
   */
  async retention(query: RetentionQuery): Promise<RetentionResult> {
    const call = { kind: "retention", query } as const;
    return posthogResultOf(call, await this.ask(call));
  }

  /**
   * Implements `ProductAnalytics.cohort`, documented there.
   *
   * @throws ProductAnalyticsQueryInvalidError for a malformed query.
   * @throws ProductAnalyticsScopeMissingError outside a scoped call while isolating by scope.
   * @throws ProductAnalyticsUnavailableError when PostHog is not configured or does not answer.
   */
  async cohort(query: CohortQuery): Promise<CohortResult> {
    const call = { kind: "cohort", query } as const;
    return posthogResultOf(call, await this.ask(call));
  }

  /**
   * The scope every query is narrowed to.
   *
   * @throws ProductAnalyticsScopeMissingError when isolating by scope outside a scoped call.
   */
  private scope(): PosthogScope {
    const property = this.settings.scopeProperty;
    if (property === null) return null;
    const context = this.storage.current() as { readonly scopeId?: string } | undefined;
    const id = context?.scopeId;
    if (id === undefined || id === "") throw ProductAnalyticsScopeMissingError.create();
    return { property, id };
  }

  /** Checks `call`, posts it to the query API narrowed to the call's scope, and returns the parsed reply. */
  private async ask(call: ProductAnalyticsCall): Promise<unknown> {
    checkProductAnalyticsQuery(call, this.settings.scopeProperty);
    const query = posthogQueryOf(call, this.scope());
    const { host, projectId, keySecret } = this.settings;
    if (projectId === null || keySecret === null)
      unavailable("reports.posthog.projectId and reports.posthog.keySecret are not configured");
    const key = this.secrets.get(keySecret);
    if (key === undefined || key === "") unavailable(`the key secret ${keySecret} is not bound`);
    const url = `${host.replace(/\/+$/, "")}/api/projects/${projectId}/query/`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ query }),
    }).catch(() => unavailable("PostHog could not be reached"));
    if (!response.ok) unavailable(`PostHog answered ${response.status}`);
    return (await response.json().catch(() => unavailable("PostHog answered no JSON"))) as unknown;
  }
}
