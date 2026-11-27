/**
 * Stackra file contract:
 * Purpose: unit tests of `HttpConfig`: keyed `app.http`, built with a 1 MiB body cap and a 20-second drain deadline,
 *          a host override of each, a zero cap and a drain deadline outside 1 to 600 seconds refused; the shipped
 *          schema's defaults equal `HttpOptions`' initializers; the load-shedding bulkhead defaults to 1024 calls at once,
 *          1024 queued and a 5-second wait, takes a host's override (0 turns it off) and refuses values out of range.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 19, 20 and 26); ADR 0237 (STA-2577 note); ADR
 *                     0143 (decision 3: draining timeouts).
 */
import { buildConfig, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { HttpConfig as BaseHttpConfig } from "#config/http.config";
import { HTTP_CONFIG_SCHEMA } from "#core/constants/http-config-schema.constant";
import { HttpOptions } from "#core/schemas/http-options.schema";

describe("HttpConfig", () => {
  it("is keyed app.http", () => {
    expect(configKey(BaseHttpConfig, "app")).toBe("app.http");
  });

  it("caps a body at 1 MiB by default", () => {
    expect(buildConfig(BaseHttpConfig).maxBodyBytes).toBe(1_048_576);
  });

  it("takes a host's override", () => {
    class HttpConfig extends BaseHttpConfig {
      override maxBodyBytes = 4096;
    }
    expect(buildConfig(HttpConfig).maxBodyBytes).toBe(4096);
  });

  it("refuses a zero cap", () => {
    class ZeroHttpConfig extends BaseHttpConfig {
      override maxBodyBytes = 0;
    }
    expect(() => buildConfig(ZeroHttpConfig)).toThrow(ConfigInvalidError);
  });

  it("bounds the drain at 20 seconds by default", () => {
    expect(buildConfig(BaseHttpConfig).drainTimeoutSeconds).toBe(20);
  });

  it("takes a host's drain deadline", () => {
    class HttpConfig extends BaseHttpConfig {
      override drainTimeoutSeconds = 45;
    }
    expect(buildConfig(HttpConfig).drainTimeoutSeconds).toBe(45);
  });

  it.each([0, 601, 1.5])("refuses a drain deadline of %s seconds", (seconds) => {
    class OutOfRangeHttpConfig extends BaseHttpConfig {
      override drainTimeoutSeconds = seconds;
    }
    expect(() => buildConfig(OutOfRangeHttpConfig)).toThrow(ConfigInvalidError);
  });

  it("sheds load past 1024 calls at once, 1024 queued and a 5-second wait by default", () => {
    const { maxConcurrentCalls, maxQueuedCalls, maxQueueWaitMs } = buildConfig(BaseHttpConfig);
    expect({ maxConcurrentCalls, maxQueuedCalls, maxQueueWaitMs }).toEqual({
      maxConcurrentCalls: 1024,
      maxQueuedCalls: 1024,
      maxQueueWaitMs: 5000,
    });
  });

  it("takes a host's bulkhead, and 0 calls at once to turn shedding off", () => {
    class HttpConfig extends BaseHttpConfig {
      override maxConcurrentCalls = 0;

      override maxQueuedCalls = 0;

      override maxQueueWaitMs = 0;
    }
    const { maxConcurrentCalls, maxQueuedCalls, maxQueueWaitMs } = buildConfig(HttpConfig);
    expect([maxConcurrentCalls, maxQueuedCalls, maxQueueWaitMs]).toEqual([0, 0, 0]);
  });

  it.each([
    ["maxConcurrentCalls", -1],
    ["maxConcurrentCalls", 1.5],
    ["maxQueuedCalls", 1_000_001],
    ["maxQueueWaitMs", 60_001],
  ] as const)("refuses %s = %s", (field, value) => {
    class OutOfRangeHttpConfig extends BaseHttpConfig {
      override maxConcurrentCalls = field === "maxConcurrentCalls" ? value : 1024;

      override maxQueuedCalls = field === "maxQueuedCalls" ? value : 1024;

      override maxQueueWaitMs = field === "maxQueueWaitMs" ? value : 5000;
    }
    expect(() => buildConfig(OutOfRangeHttpConfig)).toThrow(ConfigInvalidError);
  });

  it("ships a schema default equal to the shape's initializer", () => {
    expect(HTTP_CONFIG_SCHEMA.parse({})).toEqual({ ...new HttpOptions() });
  });
});
