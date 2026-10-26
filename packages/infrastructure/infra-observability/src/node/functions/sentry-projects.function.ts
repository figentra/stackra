/**
 * Stackra file contract:
 * Purpose: `sentryProjects(args)`, the Sentry slice of the core stack: one team named after the project, one project
 *          per app member that names one (`telemetry.sentryProject`), its DSN key, and per deployed environment an
 *          issue alert that mails the issue's owners, or every active member, when an issue is first seen or
 *          regresses. Returns the public DSN of each member under its member key, the value `ref:sentry.dsn.<member>`
 *          names in the app runways.
 * Boundary: declares Pulumi resources only. The provider's auth token (`sentry:token`, org and project write) is the
 *           owner's stack config; the release job's `SENTRY_AUTH_TOKEN` uploads source maps and is not this one. A
 *           DSN is public, so it is no secret output.
 * Runtime: node
 * Governing contract: ADR 0184 (decision 6: Sentry handles crash reports), ADR 0171 (decision 6: Sentry in the core
 *                     stack), ADR 0296 (decision 1: the project is a member fact).
 */
import type * as pulumi from "@pulumi/pulumi";
import * as sentry from "@pulumiverse/sentry";
import type { RunwayEnvironment } from "@stackra/runway";

import type { ObservabilityPlan } from "#core/types/observability-plan.type";

/** An issue seen for the first time, or one that was resolved and came back: the two that need a person. */
const NEW_OR_REGRESSED = [
  { id: "sentry.rules.conditions.first_seen_event.FirstSeenEventCondition" },
  { id: "sentry.rules.conditions.regression_event.RegressionEventCondition" },
];

/** Mail the issue's owners (ownership rules or code owners), falling back to every active member. */
const MAIL_OWNERS = [
  {
    id: "sentry.mail.actions.NotifyEmailAction",
    targetType: "IssueOwners",
    fallthroughType: "ActiveMembers",
  },
];

/**
 * The team, the projects with their key and alerts, and the DSN of each member.
 *
 * @param args - the team slug (the root runway's `project`), the plan's Sentry block and the deployed environments.
 * @example
 * const { dsn } = sentryProjects({ team: "acme-platform", sentry: plan.sentry, environments: plan.environments });
 * dsn.web; // the public DSN `ref:sentry.dsn.web` resolves to
 */
export function sentryProjects(args: {
  readonly team: string;
  readonly sentry: NonNullable<ObservabilityPlan["sentry"]>;
  readonly environments: readonly RunwayEnvironment[];
}) {
  const { org: organization, projects } = args.sentry;
  const team = new sentry.SentryTeam(`sentry-team-${args.team}`, {
    organization,
    name: args.team,
    slug: args.team,
  });
  const members = Object.fromEntries(
    projects.map(({ member, slug }) => {
      const project = new sentry.SentryProject(`sentry-${slug}`, {
        organization,
        name: slug,
        slug,
        teams: [team.slug],
      });
      const key = new sentry.SentryKey(`sentry-${slug}-key`, {
        organization,
        project: project.slug,
        name: "runway",
      });
      const alerts = args.environments.map(
        (environment) =>
          new sentry.SentryIssueAlert(`sentry-${slug}-${environment}`, {
            organization,
            project: project.slug,
            name: `New or regressed issue in ${environment}`,
            environment,
            actionMatch: "any",
            filterMatch: "all",
            frequency: 30,
            conditions: NEW_OR_REGRESSED,
            actions: MAIL_OWNERS,
          }),
      );
      return [member, { project, key, alerts }] as const;
    }),
  );
  const dsn: Record<string, pulumi.Output<string>> = Object.fromEntries(
    Object.entries(members).map(([member, { key }]) => [member, key.dsnPublic]),
  );
  return { team, members, dsn };
}
