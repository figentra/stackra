/**
 * Stackra file contract:
 * Purpose: unit tests of `HttpForecasterDriver`: a query is posted to `<baseUrl>/forecast` in the image's contract shape
 *          and its rows are returned; the bearer token is sent only when a token name is configured, read from the
 *          runtime secret store at call time; an unconfigured service, an unbound token, an unreachable service, an
 *          error status, a non-JSON or misshapen reply are unavailable; a 400 and a malformed query are invalid; the
 *          token never appears in an error.
 * Boundary: test only; `fetch` is replaced, so no request leaves the process; the token is a test value held by a
 *           stand-in `SecretStore`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0492 (decision 8); ADR 0173.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Forecaster } from "#contracts/ports/forecaster.port";
import type { ForecastQuery } from "#contracts/types/forecast-query.type";
import { ReportsConfig } from "#node/config/reports.config";
import { HttpForecasterDriver } from "#node/drivers/http-forecaster.driver";
import { ForecastQueryInvalidError } from "#node/errors/forecast-query-invalid.error";
import { ForecastUnavailableError } from "#node/errors/forecast-unavailable.error";

/** The test token; a test-only value. */
const TOKEN = "test-only-forecast-token";

/** A secret store holding `values`. */
function storeOf(values: Readonly<Record<string, string>>): SecretStore {
  return Object.assign(Object.create(SecretStore.prototype) as SecretStore, {
    get: (name: string) => values[name],
  });
}

/** A driver over the forecast settings `forecast`, with the token bound unless `bound` is false. */
function driverWith(forecast: Record<string, unknown> = {}, bound = true): HttpForecasterDriver {
  const config = buildConfig(ReportsConfig, {
    values: { forecast: { baseUrl: "http://forecast.test:8080/", ...forecast } },
  });
  return new HttpForecasterDriver(config, storeOf(bound ? { FORECAST_TOKEN: TOKEN } : {}));
}

const QUERY: ForecastQuery = {
  series: [
    { id: "sku-1", timestamps: ["2026-10-01", "2026-10-02", "2026-10-03"], values: [3, 4, 5] },
  ],
  horizon: 2,
  frequency: "D",
};

const ROW = {
  id: "sku-1",
  model: "AutoETS",
  timestamps: ["2026-10-04T00:00:00", "2026-10-05T00:00:00"],
  mean: [5, 5.5],
  lo80: [4, 4.2],
  hi80: [6, 6.8],
};

/** Replaces `fetch` with a service that answers `reply` with `status`. */
function answering(reply: unknown, status = 200) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async () => new Response(JSON.stringify(reply), { status }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe(HttpForecasterDriver, () => {
  it("posts the query in the image's shape and returns its rows", async () => {
    const fetch = answering([ROW]);
    const driver = driverWith();
    expect(driver).toBeInstanceOf(Forecaster);
    await expect(driver.forecast({ ...QUERY, models: ["AutoETS"] })).resolves.toEqual([ROW]);
    expect(fetch).toHaveBeenCalledWith(
      "http://forecast.test:8080/forecast",
      expect.objectContaining({ method: "POST", headers: { "content-type": "application/json" } }),
    );
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual({
      ...QUERY,
      models: ["AutoETS"],
    });
  });

  it("leaves models out when none is named and sends no token unless one is configured", async () => {
    const fetch = answering([]);
    await driverWith().forecast(QUERY);
    const init = fetch.mock.calls[0]?.[1];
    expect(JSON.parse(String(init?.body))).not.toHaveProperty("models");
    expect(init?.headers).not.toHaveProperty("authorization");
  });

  it("sends the configured token, read from the secret store", async () => {
    const fetch = answering([ROW]);
    await driverWith({ tokenSecret: "FORECAST_TOKEN" }).forecast(QUERY);
    expect(fetch.mock.calls[0]?.[1]?.headers).toEqual({
      "content-type": "application/json",
      authorization: `Bearer ${TOKEN}`,
    });
  });

  it("is unavailable when unconfigured, unbound, unreachable, failing or misshapen", async () => {
    const unconfigured = driverWith({ baseUrl: null });
    await expect(unconfigured.forecast(QUERY)).rejects.toBeInstanceOf(ForecastUnavailableError);

    const unbound = driverWith({ tokenSecret: "FORECAST_TOKEN" }, false);
    await expect(unbound.forecast(QUERY)).rejects.toBeInstanceOf(ForecastUnavailableError);

    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("connect ECONNREFUSED"));
    await expect(driverWith().forecast(QUERY)).rejects.toBeInstanceOf(ForecastUnavailableError);
    vi.restoreAllMocks();

    answering({ error: "boom" }, 503);
    await expect(driverWith().forecast(QUERY)).rejects.toBeInstanceOf(ForecastUnavailableError);
    vi.restoreAllMocks();

    answering({ not: "rows" });
    await expect(driverWith().forecast(QUERY)).rejects.toBeInstanceOf(ForecastUnavailableError);
    vi.restoreAllMocks();

    answering([{ ...ROW, mean: [1] }]);
    await expect(driverWith().forecast(QUERY)).rejects.toBeInstanceOf(ForecastUnavailableError);
  });

  it("refuses a malformed query before any request, and a 400 from the service", async () => {
    const fetch = answering([ROW]);
    await expect(driverWith().forecast({ ...QUERY, horizon: 0 })).rejects.toBeInstanceOf(
      ForecastQueryInvalidError,
    );
    expect(fetch).not.toHaveBeenCalled();
    vi.restoreAllMocks();

    answering({ error: "invalid_request" }, 400);
    await expect(driverWith().forecast(QUERY)).rejects.toBeInstanceOf(ForecastQueryInvalidError);
  });

  it("never puts the token in an error", async () => {
    answering({ detail: TOKEN }, 500);
    const failure = await driverWith({ tokenSecret: "FORECAST_TOKEN" })
      .forecast(QUERY)
      .catch((error: unknown) => error);
    expect(JSON.stringify(failure)).not.toContain(TOKEN);
    expect(String((failure as Error).message)).not.toContain(TOKEN);
  });
});
