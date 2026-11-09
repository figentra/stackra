/**
 * Stackra file contract:
 * Purpose: unit tests of `proxyBuildArgs`: both spellings from either one, empty and unset variables left out, and
 *          nothing else of the environment passed to a build.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182; ADR 0022; STA-2572.
 */
import { describe, expect, it } from "@stackra/testing";

import { proxyBuildArgs } from "#testing/functions/proxy-build-args.function";

describe("proxyBuildArgs", () => {
  it("passes each proxy variable that is set, in both spellings", () => {
    expect(
      proxyBuildArgs({
        HTTPS_PROXY: "http://10.199.0.1:3128",
        http_proxy: "http://10.199.0.1:3128",
        NO_PROXY: "localhost,127.0.0.1",
        PATH: "/usr/bin",
        TURBO_TOKEN: "not-for-a-build",
      }),
    ).toEqual({
      HTTP_PROXY: "http://10.199.0.1:3128",
      http_proxy: "http://10.199.0.1:3128",
      HTTPS_PROXY: "http://10.199.0.1:3128",
      https_proxy: "http://10.199.0.1:3128",
      NO_PROXY: "localhost,127.0.0.1",
      no_proxy: "localhost,127.0.0.1",
    });
  });

  it("passes nothing on a machine without a proxy", () => {
    expect(proxyBuildArgs({ PATH: "/usr/bin", HTTPS_PROXY: "" })).toEqual({});
  });
});
