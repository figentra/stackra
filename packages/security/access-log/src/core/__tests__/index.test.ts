/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the facet, the service, the configuration (which the template's
 *          host override extends), its shape and shipped schema under the generated name `AccessLogOptions$`, the
 *          memory sink, the chain functions, the refusal and the log event, and nothing else is a value.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import type { Actor } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { AccessLoggedOptions } from "#contracts/index";
import { ACCESS_LOG_CONFIG_SCHEMA } from "#core/constants/access-log-config-schema.constant";
import * as accessLog from "#core/index";

describe("@stackra/access-log", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(accessLog).sort()).toEqual([
      "ACCESS_LOG_WRITE_FAILED",
      "AccessLogConfig",
      "AccessLogOptions",
      "AccessLogOptions$",
      "AccessLogService",
      "AccessLogWriteFailedError",
      "AccessLogged",
      "MemoryAccessLogSinkDriver",
      "findChainBreak",
      "linkAccessRecord",
    ]);
  });

  it("exports the shipped schema under its generated name", () => {
    expect(accessLog.AccessLogOptions$).toBe(ACCESS_LOG_CONFIG_SCHEMA);
  });

  it("takes the template's call shapes", () => {
    expectTypeOf(accessLog.AccessLogged).parameter(0).toEqualTypeOf<AccessLoggedOptions>();
    expectTypeOf<accessLog.AccessLogService["record"]>().parameters.toEqualTypeOf<
      [string, Actor, string, AccessLoggedOptions, readonly unknown[]]
    >();
  });
});
