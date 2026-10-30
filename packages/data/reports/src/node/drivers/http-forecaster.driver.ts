/**
 * Stackra file contract:
 * Purpose: `HttpForecasterDriver`, the `http` driver of the `Forecaster` port: it checks a query, posts it to the
 *          region's `tools-forecast` image (`POST <baseUrl>/forecast` with `{series, horizon, frequency, models?}`) and
 *          returns the `[{id, model, timestamps, mean, lo80, hi80}]` rows it answers.
 * Boundary: implements the port only; plain `fetch`, no SDK. `reports.forecast.baseUrl` is the `ToolEndpoint` of the
 *           `forecast` tool. The image takes no token inside the private namespace, so `reports.forecast.tokenSecret`
 *           is optional: when it names a secret, its value is read at call time from the runtime's `SecretStore` and
 *           sent as a bearer token (ADR 0173), and is never logged, kept or put in an error. A series and the service's
 *           reply body never appear in an error either.
 * Runtime: node
 * Governing contract: ADR 0492 (decision 8); ADR 0173 (secrets from the runtime secret store); ADR 0142; ADR 0294
 *                     (decisions 16 and 17).
 */
import type { SecretStore } from "@stackra/config/contracts";
import { Driver } from "@stackra/container";

import { Forecaster } from "#contracts/ports/forecaster.port";
import type { ForecastQuery } from "#contracts/types/forecast-query.type";
import type { ForecastRow } from "#contracts/types/forecast-row.type";
import type { ReportsConfig } from "#node/config/reports.config";
import { ForecastQueryInvalidError } from "#node/errors/forecast-query-invalid.error";
import { ForecastUnavailableError } from "#node/errors/forecast-unavailable.error";
import { checkForecastQuery } from "#node/functions/check-forecast-query.function";
import { forecastRowsOf } from "#node/functions/forecast-rows-of.function";

/** Throws the refusal of an unanswerable forecast for `reason`. */
function unavailable(reason: string): never {
  throw ForecastUnavailableError.create({ driver: "http", reason });
}

/**
 * Forecasts on the region's StatsForecast service.
 *
 * @example
 * // runway.yaml: config.reports.forecast: { baseUrl: "http://forecast.gcc.tools.acme.internal:8080" }
 * // generated wiring: { port: Forecaster, selectedBy: "config:reports.forecaster", candidates: { http: … }, deps: { http: [ReportsConfig, SecretStore] } }
 */
export class HttpForecasterDriver extends Driver(Forecaster) {
  /** The service origin and the optional token secret name. */
  private readonly settings: ReportsConfig["forecast"];

  /** Where the token is read from at call time. */
  private readonly secrets: SecretStore;

  /**
   * @param config - the reports configuration (`forecast`).
   * @param secrets - the runtime's secret store.
   */
  constructor(config: ReportsConfig, secrets: SecretStore) {
    super();
    this.settings = config.forecast;
    this.secrets = secrets;
  }

  /**
   * Implements `Forecaster.forecast`, documented there.
   *
   * @throws ForecastQueryInvalidError for a malformed query, or one the service refuses.
   * @throws ForecastUnavailableError when the service is not configured, does not answer or answers badly.
   */
  async forecast(query: ForecastQuery): Promise<readonly ForecastRow[]> {
    checkForecastQuery(query);
    const { baseUrl, tokenSecret } = this.settings;
    if (baseUrl === null) unavailable("reports.forecast.baseUrl is not configured");
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (tokenSecret !== null) {
      const token = this.secrets.get(tokenSecret);
      if (token === undefined || token === "")
        unavailable(`the token secret ${tokenSecret} is not bound`);
      headers.authorization = `Bearer ${token}`;
    }
    const { series, horizon, frequency, models } = query;
    const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/forecast`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        series,
        horizon,
        frequency,
        ...(models === undefined ? {} : { models }),
      }),
    }).catch(() => unavailable("the forecast service could not be reached"));
    if (response.status === 400)
      throw ForecastQueryInvalidError.create({ reason: "the forecast service refused the query" });
    if (!response.ok) unavailable(`the forecast service answered ${response.status}`);
    const reply = (await response
      .json()
      .catch(() => unavailable("the forecast service answered no JSON"))) as unknown;
    return (
      forecastRowsOf(reply) ?? unavailable("the forecast service answered an unreadable shape")
    );
  }
}
