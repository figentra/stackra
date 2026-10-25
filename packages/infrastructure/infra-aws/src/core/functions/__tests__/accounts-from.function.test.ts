/**
 * Stackra file contract:
 * Purpose: unit tests of `accountsFrom`: the shared and backup accounts (null when unlisted), the required tags and
 *          each environment's account in promotion order; an environment naming an unlisted account is refused with
 *          its path, and an environment with no `encore.account` is skipped.
 * Boundary: test only; the narrowed runway is built by `parseInfraRunway` from a `parseRunway` root.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0172 (decision 1), ADR 0171 (decision 4).
 */
import { parseRunway, RunwayInvalidError } from "@stackra/runway";
import { describe, expect, it } from "@stackra/testing";

import { accountsFrom } from "#core/functions/accounts-from.function";
import { parseInfraRunway } from "#core/functions/parse-infra-runway.function";

/** The narrowed runway of the given accounts and environments (`null` leaves `encore` out). */
function runwayWith(accounts: Record<string, string>, environments: Record<string, string | null>) {
  return parseInfraRunway(
    parseRunway("root", {
      version: 3,
      project: "acme",
      providers: { aws: { region: "me-central-1", accounts, requiredTags: ["env"] } },
      environments: Object.fromEntries(
        Object.entries(environments).map(([environment, account]) => [
          environment,
          account === null ? {} : { encore: { account } },
        ]),
      ),
    }),
  );
}

describe("accountsFrom", () => {
  it("lists the environments' accounts in promotion order with the shared and backup ones", () => {
    const accounts = accountsFrom(
      runwayWith(
        {
          shared: "111111111111",
          backup: "222222222222",
          prod: "333333333333",
          np: "444444444444",
        },
        { production: "prod", staging: "np" },
      ),
    );

    expect(accounts).toEqual({
      project: "acme",
      region: "me-central-1",
      shared: "111111111111",
      backup: "222222222222",
      requiredTags: ["env"],
      environments: [
        { environment: "staging", name: "np", account: "444444444444" },
        { environment: "production", name: "prod", account: "333333333333" },
      ],
    });
  });

  it("answers null for an unlisted shared or backup account and skips an environment without one", () => {
    const accounts = accountsFrom(
      runwayWith({ prod: "333333333333" }, { staging: null, production: "prod" }),
    );

    expect([accounts.shared, accounts.backup]).toEqual([null, null]);
    expect(accounts.environments.map((entry) => entry.environment)).toEqual(["production"]);
  });

  it("refuses an environment naming an unlisted account", () => {
    const runway = runwayWith({ prod: "333333333333" }, { staging: "np" });

    expect(() => accountsFrom(runway)).toThrow(RunwayInvalidError);
    expect(() => accountsFrom(runway)).toThrow(
      /environments\.staging\.encore\.account: providers\.aws\.accounts has no "np"/,
    );
  });
});
