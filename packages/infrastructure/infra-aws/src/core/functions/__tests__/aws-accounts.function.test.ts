/**
 * Stackra file contract:
 * Purpose: unit tests of `awsAccounts`: the shared and backup accounts, the required tags and each environment's
 *          account in promotion order; an environment naming an unlisted account and a root with no `providers.aws`
 *          are refused with their paths.
 * Boundary: test only; roots are built through `parseRunway`, so each is a valid root runway.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0172 (decision 1), ADR 0171 (decision 4).
 */
import { parseRunway, RunwayInvalidError } from "@stackra/runway";
import { describe, expect, it } from "@stackra/testing";

import { awsAccounts } from "#core/functions/aws-accounts.function";

/** A root runway with the given AWS accounts and environment accounts. */
function rootWith(accounts: Record<string, string> | null, environments: Record<string, string>) {
  return parseRunway("root", {
    version: 3,
    project: "acme-platform",
    ...(accounts === null ? {} : { providers: { aws: { region: "me-central-1", accounts } } }),
    environments: Object.fromEntries(
      Object.entries(environments).map(([environment, account]) => [
        environment,
        { encore: { account } },
      ]),
    ),
  });
}

describe("awsAccounts", () => {
  it("lists the shared, backup and environment accounts in promotion order", () => {
    const root = rootWith(
      {
        shared: "111111111111",
        backup: "ref:aws.accounts.backup",
        nonprod: "222222222222",
        prod: "333333333333",
      },
      { production: "prod", staging: "nonprod" },
    );

    expect(awsAccounts(root)).toEqual({
      project: "acme-platform",
      region: "me-central-1",
      shared: "111111111111",
      backup: "ref:aws.accounts.backup",
      requiredTags: [],
      environments: [
        { environment: "staging", name: "nonprod", account: "222222222222" },
        { environment: "production", name: "prod", account: "333333333333" },
      ],
    });
  });

  it("answers null for a missing shared or backup account", () => {
    const accounts = awsAccounts(rootWith({ prod: "333333333333" }, { production: "prod" }));

    expect([accounts.shared, accounts.backup]).toEqual([null, null]);
  });

  it("refuses an environment that names an unlisted account", () => {
    const root = rootWith({ prod: "333333333333" }, { staging: "nonprod" });

    expect(() => awsAccounts(root)).toThrow(RunwayInvalidError);
    expect(() => awsAccounts(root)).toThrow(
      /environments\.staging\.encore\.account: providers\.aws\.accounts has no "nonprod"/,
    );
  });

  it("refuses a root with no providers.aws", () => {
    expect(() => awsAccounts(rootWith(null, {}))).toThrow(/providers/);
  });
});
