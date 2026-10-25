/**
 * Stackra file contract:
 * Purpose: unit tests of `sentryProjects`: one team named after the project, one project and DSN key per app, a
 *          new-or-regressed issue alert per project and deployed environment that mails the owners, and the public DSN
 *          of each app under its member key.
 * Boundary: test only; Pulumi under mocks, so no provider or cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0184 (decision 6), ADR 0171 (decision 6).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import {
  declaredAs,
  inputsByName,
  mockPulumi,
  settled,
  valueOf,
  type DeclaredResource,
} from "#node/functions/__tests__/fixtures/pulumi-mocks.fixture";
import { sentryProjects } from "#node/functions/sentry-projects.function";

let declared: DeclaredResource[];

beforeEach(async () => {
  declared = await mockPulumi();
});

describe("sentryProjects", () => {
  it("declares the team, the projects, their keys and alerts", async () => {
    const sentry = sentryProjects({
      team: "acme-platform",
      sentry: {
        org: "acme",
        projects: [
          { member: "web", slug: "acme-web" },
          { member: "mobile", slug: "acme-mobile" },
        ],
      },
      environments: ["staging", "production"],
    });
    await settled(sentry);

    expect(declaredAs(declared, "sentry:index/sentryTeam:SentryTeam")[0]?.inputs).toEqual({
      organization: "acme",
      name: "acme-platform",
      slug: "acme-platform",
    });
    expect(inputsByName(declared, "sentry:index/sentryProject:SentryProject")).toEqual({
      "sentry-acme-web": {
        organization: "acme",
        name: "acme-web",
        slug: "acme-web",
        teams: ["acme-platform"],
      },
      "sentry-acme-mobile": {
        organization: "acme",
        name: "acme-mobile",
        slug: "acme-mobile",
        teams: ["acme-platform"],
      },
    });
    expect(
      inputsByName(declared, "sentry:index/sentryKey:SentryKey")["sentry-acme-web-key"],
    ).toEqual({ organization: "acme", project: "acme-web", name: "runway" });
    const alerts = inputsByName(declared, "sentry:index/sentryIssueAlert:SentryIssueAlert");
    expect(Object.keys(alerts).sort()).toEqual([
      "sentry-acme-mobile-production",
      "sentry-acme-mobile-staging",
      "sentry-acme-web-production",
      "sentry-acme-web-staging",
    ]);
    expect(alerts["sentry-acme-web-production"]).toEqual({
      organization: "acme",
      project: "acme-web",
      name: "New or regressed issue in production",
      environment: "production",
      actionMatch: "any",
      filterMatch: "all",
      frequency: 30,
      conditions: [
        { id: "sentry.rules.conditions.first_seen_event.FirstSeenEventCondition" },
        { id: "sentry.rules.conditions.regression_event.RegressionEventCondition" },
      ],
      actions: [
        {
          id: "sentry.mail.actions.NotifyEmailAction",
          targetType: "IssueOwners",
          fallthroughType: "ActiveMembers",
        },
      ],
    });
    expect(Object.keys(sentry.dsn)).toEqual(["web", "mobile"]);
    expect(await valueOf(sentry.dsn["web"]!)).toBe("https://sentry-acme-web-key@sentry.test/1");
  });
});
