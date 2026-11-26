/**
 * Stackra file contract:
 * Purpose: unit tests of `heartbeatUrls`: an empty secret is no URL; a JSON object of kebab-case job names to
 *          `https://` URLs is read by job name; anything else is refused.
 * Boundary: test only; the URLs are made up.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0184 (decision 4); ADR 0173.
 */
import { describe, expect, it } from "@stackra/testing";

import { heartbeatUrls } from "#core/functions/heartbeat-urls.function";

const URL_A = "https://uptime.example.test/api/v1/heartbeat/token-a";

describe(heartbeatUrls, () => {
  it("reads a JSON object of kebab-case job names to https URLs", () => {
    expect(heartbeatUrls("")).toEqual(new Map());
    expect(heartbeatUrls(JSON.stringify({ "queue-default": URL_A }))).toEqual(
      new Map([["queue-default", URL_A]]),
    );
    expect(heartbeatUrls("{")).toBeUndefined();
    expect(heartbeatUrls("null")).toBeUndefined();
    expect(heartbeatUrls(JSON.stringify({ "queue-default": "not a url" }))).toBeUndefined();
    expect(
      heartbeatUrls(JSON.stringify({ "queue-default": "http://uptime.example.test/a" })),
    ).toBeUndefined();
    expect(heartbeatUrls(JSON.stringify({ Queue_Default: URL_A }))).toBeUndefined();
    expect(heartbeatUrls(JSON.stringify([URL_A]))).toBeUndefined();
  });
});
