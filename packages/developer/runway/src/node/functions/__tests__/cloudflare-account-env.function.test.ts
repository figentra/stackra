/**
 * Stackra file contract:
 * Purpose: unit tests of `cloudflareAccountEnv`: a literal account id becomes wrangler's `CLOUDFLARE_ACCOUNT_ID`; a
 *          `ref:` id leaves the job's variable alone, and refuses when the job has none; no id sets nothing.
 * Boundary: test only; pure, with an explicit environment object.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2124.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { cloudflareAccountEnv } from "#node/functions/cloudflare-account-env.function";

// @covers sta-2124:FR-001 sta-2124:FR-002 sta-2124:FR-003 sta-2124:AC-001 sta-2124:AC-002 sta-2124:AC-003 sta-2124:AC-004
describe("cloudflareAccountEnv", () => {
  it("sets a literal account id", () => {
    expect(cloudflareAccountEnv("acct-1", {})).toEqual({ CLOUDFLARE_ACCOUNT_ID: "acct-1" });
    expect(cloudflareAccountEnv("acct-1", { CLOUDFLARE_ACCOUNT_ID: "other" })).toEqual({
      CLOUDFLARE_ACCOUNT_ID: "acct-1",
    });
  });

  it("leaves the job's variable alone for a ref:", () => {
    expect(
      cloudflareAccountEnv("ref:cloudflare.accountId", { CLOUDFLARE_ACCOUNT_ID: "acct-1" }),
    ).toBeUndefined();
  });

  it("refuses a ref: when the job has no CLOUDFLARE_ACCOUNT_ID, naming the variable", () => {
    for (const env of [{}, { CLOUDFLARE_ACCOUNT_ID: "" }])
      expect(() => cloudflareAccountEnv("ref:cloudflare.accountId", env)).toThrow(
        RunwayUnresolvedError,
      );
    expect(() => cloudflareAccountEnv("ref:cloudflare.accountId", {})).toThrow(
      /CLOUDFLARE_ACCOUNT_ID is not set/,
    );
  });

  it("sets nothing when the runway names no account", () => {
    expect(cloudflareAccountEnv(undefined, { CLOUDFLARE_ACCOUNT_ID: "acct-1" })).toBeUndefined();
  });
});
