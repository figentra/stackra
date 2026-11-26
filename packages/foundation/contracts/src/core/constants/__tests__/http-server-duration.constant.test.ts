/**
 * Stackra file contract:
 * Purpose: unit tests of `HTTP_SERVER_DURATION`: the stable semantic-convention name, seconds, and the advised bounds,
 *          ascending and frozen, so a recorder and an objective read the same buckets.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0184 (decisions 1 and 3); the OpenTelemetry semantic conventions (HTTP metrics).
 */
import { describe, expect, it } from "@stackra/testing";

import { HTTP_SERVER_DURATION } from "#core/constants/http-server-duration.constant";

describe("HTTP_SERVER_DURATION", () => {
  it("names the stable HTTP server histogram in seconds", () => {
    expect(HTTP_SERVER_DURATION.name).toBe("http.server.request.duration");
    expect(HTTP_SERVER_DURATION.unit).toBe("s");
  });

  it("advises the semantic-convention bounds, ascending and frozen", () => {
    expect(HTTP_SERVER_DURATION.bounds).toEqual([
      0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10,
    ]);
    expect(Object.isFrozen(HTTP_SERVER_DURATION)).toBe(true);
    expect(Object.isFrozen(HTTP_SERVER_DURATION.bounds)).toBe(true);
  });
});
