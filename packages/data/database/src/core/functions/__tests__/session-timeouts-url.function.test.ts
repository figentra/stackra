/**
 * Stackra file contract:
 * Purpose: unit tests of `sessionTimeoutsUrl` and `timeoutMilliseconds`: the timeouts become the startup `options`
 *          parameter in whole milliseconds, an `options` value the URL holds is kept, no timeouts leaves the URL as is,
 *          and a duration that is not a timeout is refused.
 * Boundary: test only; the URLs are made up.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); data-layer gap sc5 (stackra-253).
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { sessionTimeoutsUrl } from "#core/functions/session-timeouts-url.function";
import { timeoutMilliseconds } from "#core/functions/timeout-milliseconds.function";

const timeouts = {
  statement: Duration.seconds(30),
  lock: Duration.parse("1500ms"),
  idleInTransaction: Duration.minutes(1),
};

describe("sessionTimeoutsUrl", () => {
  it("adds the timeouts as startup options", () => {
    const url = new URL(
      sessionTimeoutsUrl("postgres://user@host:5432/app?sslmode=require", timeouts),
    );
    expect(url.searchParams.get("sslmode")).toBe("require");
    expect(url.searchParams.get("options")).toBe(
      "-c statement_timeout=30000 -c lock_timeout=1500 -c idle_in_transaction_session_timeout=60000",
    );
  });

  it("keeps an options value the URL holds, and leaves the URL alone without timeouts", () => {
    const url = new URL(
      sessionTimeoutsUrl("postgres://host/app?options=-c%20search_path%3Dapp", timeouts),
    );
    expect(url.searchParams.get("options")).toMatch(
      /^-c search_path=app -c statement_timeout=30000/,
    );
    expect(sessionTimeoutsUrl("postgres://host/app", undefined)).toBe("postgres://host/app");
  });
});

describe("timeoutMilliseconds", () => {
  it("reads whole milliseconds and refuses a length that is not a timeout", () => {
    expect(timeoutMilliseconds(Duration.seconds(2))).toBe(2000);
    expect(() => timeoutMilliseconds("soon" as Duration)).toThrow(RangeError);
  });
});
