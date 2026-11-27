/**
 * Stackra file contract:
 * Purpose: unit tests of `readIntegrationOptions` for `baseUrl`: a literal http(s) URL and an https template are
 *          accepted, a single `{field}` that is the whole URL is accepted, and an http template is refused; a written
 *          `key` of two snake_case parts is kept, any other is refused (STA-1739); Basic auth needs a user name and
 *          takes an empty password (RFC 7617); `timeout`, `circuitBreaker` and `concurrency` are checked (STA-1467).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rule 6); STA-1665; STA-1467.
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { AuthType } from "#core/enums/auth-type.enum";
import { IntegrationCategory } from "#core/enums/integration-category.enum";
import { readIntegrationOptions } from "#core/functions/read-integration-options.function";
import type { IntegrationOptions } from "#core/types/integration-options.type";

const read = (baseUrl: string) =>
  readIntegrationOptions({
    provider: "tools",
    category: IntegrationCategory.Other,
    levels: [],
    auth: { type: AuthType.None },
    baseUrl,
  });

describe("readIntegrationOptions baseUrl", () => {
  it("accepts a whole-URL placeholder", () => {
    expect(read("{baseUrl}").baseUrl).toBe("{baseUrl}");
  });

  it("refuses an http template", () => {
    expect(() => read("http://{host}")).toThrow(/baseUrl/);
  });

  it("leaves a literal URL and an https template unchanged", () => {
    expect(read("http://speech.internal:8080").baseUrl).toBe("http://speech.internal:8080");
    expect(read("https://{host}/api").baseUrl).toBe("https://{host}/api");
  });
});

const keyed = (key: string) =>
  readIntegrationOptions({
    key,
    provider: "stripe",
    category: IntegrationCategory.Other,
    levels: [],
    auth: { type: AuthType.None },
  });

describe("readIntegrationOptions key (STA-1739)", () => {
  it("keeps a written key of two snake_case parts", () => {
    expect(keyed("connectors.stripe").key).toBe("connectors.stripe");
    expect(keyed("connectors.amazon_payment_services").key).toBe(
      "connectors.amazon_payment_services",
    );
  });

  it.each(["stripe", "connectors.stripe.v2", "Connectors.stripe", "connectors.noon-pay", ""])(
    "refuses the key %j",
    (key) => {
      expect(() => keyed(key)).toThrow(/key/);
    },
  );
});

const basic = (username: string, password: string) =>
  readIntegrationOptions({
    provider: "medusa",
    category: IntegrationCategory.Other,
    levels: [],
    auth: { type: AuthType.Basic, username, password },
  });

describe("readIntegrationOptions Basic auth (RFC 7617)", () => {
  it("accepts a user name with a password", () => {
    expect(basic("{accountSid}", "{authToken}").auth).toEqual({
      type: AuthType.Basic,
      username: "{accountSid}",
      password: "{authToken}",
    });
  });

  it("accepts an empty password, for a provider whose key is the whole credential", () => {
    expect(basic("{apiKey}", "").auth).toMatchObject({ username: "{apiKey}", password: "" });
  });

  it("refuses an empty user name", () => {
    expect(() => basic("", "{authToken}")).toThrow(/Basic needs a username/);
  });
});

const guarded = (options: Partial<IntegrationOptions>) => () =>
  readIntegrationOptions({
    provider: "mail",
    category: IntegrationCategory.Other,
    levels: [],
    auth: { type: AuthType.None },
    ...options,
  });

describe("readIntegrationOptions timeout, circuit breaker and concurrency (STA-1467)", () => {
  it("keeps a timeout, a circuit breaker or false, and a bulkhead", () => {
    const kept = guarded({
      timeout: Duration.seconds(5),
      circuitBreaker: { failureThreshold: 3, cooldown: Duration.seconds(10) },
      concurrency: { limit: 8, queue: 0, maxWait: Duration.parse("200ms") },
    })();
    expect(kept.timeout).toBe(Duration.seconds(5));
    expect(kept.circuitBreaker).toEqual({ failureThreshold: 3, cooldown: Duration.seconds(10) });
    expect(kept.concurrency).toEqual({ limit: 8, queue: 0, maxWait: Duration.parse("200ms") });
    expect(guarded({ circuitBreaker: false })().circuitBreaker).toBe(false);
  });

  it("refuses a timeout that is not a positive Duration", () => {
    expect(guarded({ timeout: "30s" as Duration })).toThrow(RangeError);
    expect(guarded({ timeout: Duration.seconds(0) })).toThrow(RangeError);
  });

  it("refuses a circuit breaker without a whole threshold from 1 or with a zero cooldown", () => {
    expect(guarded({ circuitBreaker: { failureThreshold: 0 } })).toThrow(/circuitBreaker/);
    expect(guarded({ circuitBreaker: { failureThreshold: 2.5 } })).toThrow(/circuitBreaker/);
    expect(guarded({ circuitBreaker: { cooldown: Duration.seconds(0) } })).toThrow(RangeError);
  });

  it("refuses a bulkhead without a limit from 1 or with a negative queue", () => {
    expect(guarded({ concurrency: { limit: 0 } })).toThrow(/concurrency/);
    expect(guarded({ concurrency: { limit: 2, queue: -1 } })).toThrow(/concurrency/);
    expect(guarded({ concurrency: { limit: 2, maxWait: "1s" as Duration } })).toThrow(RangeError);
  });
});
