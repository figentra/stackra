/**
 * Stackra file contract:
 * Purpose: `observabilityPlan(root, members)`, the telemetry plan from the root runway (`project`, the environments,
 *          `providers.sentry`, `providers.betterstack` and the `observability` section) and the members (each app's
 *          `telemetry.sentryProject`, the service keys and the jobs that send heartbeats): the OTLP destination and its
 *          log retention, one heartbeat per deployed environment and job, one Sentry project per app that names one,
 *          availability and latency indicators for every service, and the public status page when the runway
 *          declares one.
 * Boundary: pure: parsed runways in, a plan out. Reports every failure at once. Reads no file, resolves no `ref:` and
 *           calls no cloud; `observabilityStack` (`./node`) declares the plan's resources.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decisions 1 to 6), ADR 0171 (decisions 2 and 6), ADR 0296 (decisions 1 and 2: member
 *                     WHAT, root WHERE), ADR 0185 (decisions 1 and 3: Better Stack runs on-call and the status page).
 */
import { Enum } from "@stackra/contracts";
import { RunwayEnvironment } from "@stackra/runway";
import type { RootRunway, RunwayIssue } from "@stackra/runway";

import { OBSERVABILITY_SCHEMA } from "#core/constants/observability-schema.constant";
import { HeartbeatKind } from "#core/enums/heartbeat-kind.enum";
import { SliKind } from "#core/enums/sli-kind.enum";
import { ObservabilityConfigInvalidError } from "#core/errors/observability-config-invalid.error";
import type { HeartbeatSource } from "#core/types/heartbeat-source.type";
import type { ObservabilityMembers } from "#core/types/observability-members.type";
import type { ObservabilityPlan } from "#core/types/observability-plan.type";
import type { ServiceSli } from "#core/types/service-sli.type";

/** The stable OpenTelemetry HTTP server histogram both indicators read. */
const HTTP_DURATION = "http.server.request.duration";

/** No alerts or heartbeats on a developer machine or on pull-request previews, which live for days. */
const UNMONITORED: ReadonlySet<RunwayEnvironment> = new Set([
  RunwayEnvironment.Dev,
  RunwayEnvironment.Preview,
]);

/** Better Stack's shortest heartbeat period, in seconds. */
const MIN_PERIOD = 30;

/** A Sentry organization or project slug. */
const SLUG = /^[a-z0-9][a-z0-9_-]*$/;

/** A job name: kebab-case. */
const JOB_NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/** The `observability.heartbeats` switch of each kind. */
const SWITCH = {
  [HeartbeatKind.Cron]: "crons",
  [HeartbeatKind.Relay]: "relays",
  [HeartbeatKind.Worker]: "workers",
} as const;

/**
 * The telemetry plan of a repository.
 *
 * @param root - the parsed root runway.
 * @param members - the app runways, the service keys and the jobs that send heartbeats.
 * @throws ObservabilityConfigInvalidError naming every invalid path, prefixed `root.`, `apps.` or `heartbeats.`: a
 *         misspelt or out-of-range `observability` key, retention or heartbeats without `providers.betterstack`, a
 *         Sentry project without `providers.sentry.org` or claimed by two apps, or a heartbeat job of an unknown
 *         service, with a bad name, a period under 30 seconds, or listed twice.
 * @example
 * const plan = observabilityPlan(readRunway("runway.yaml", "root"), {
 *   apps: { web: readRunway("apps/web/runway.yaml", "app") },
 *   services: ["commerce"],
 *   heartbeats: [{ service: "commerce", kind: HeartbeatKind.Cron, name: "nightly-export", periodSeconds: 86_400 }],
 * });
 * plan.telemetry; // { hotDays: 30, coldMonths: 13 }
 */
export function observabilityPlan(
  root: RootRunway,
  members: ObservabilityMembers,
): ObservabilityPlan {
  const issues: RunwayIssue[] = [];

  const parsed = OBSERVABILITY_SCHEMA.safeParse(root.observability ?? {});
  if (!parsed.success)
    for (const issue of parsed.error.issues)
      issues.push({
        path: ["root.observability", ...issue.path.map(String)].join("."),
        message: issue.message,
      });
  // Defaults stand in for a bad section, so the checks below still report.
  const policy = parsed.success ? parsed.data : OBSERVABILITY_SCHEMA.parse({});

  const environments = Enum.values(RunwayEnvironment).filter(
    (environment) => root.environments[environment] !== undefined && !UNMONITORED.has(environment),
  );

  const services = new Set(members.services);
  const listed = new Set<string>();
  const jobs: HeartbeatSource[] = [];
  (members.heartbeats ?? []).forEach((source, index) => {
    const at = `heartbeats.${index}`;
    if (!services.has(source.service))
      issues.push({ path: `${at}.service`, message: `${source.service} is not a service member` });
    if (!JOB_NAME.test(source.name))
      issues.push({ path: `${at}.name`, message: "Expected a kebab-case job name" });
    if (!Number.isInteger(source.periodSeconds) || source.periodSeconds < MIN_PERIOD)
      issues.push({
        path: `${at}.periodSeconds`,
        message: `Expected whole seconds, at least ${MIN_PERIOD}`,
      });
    const key = `${source.service}/${source.name}`;
    if (listed.has(key)) issues.push({ path: `${at}.name`, message: `${key} is listed twice` });
    listed.add(key);
    if (policy.heartbeats[SWITCH[source.kind]]) jobs.push(source);
  });

  const betterstack = root.providers?.["betterstack"] !== undefined;
  if (!betterstack && (root.observability !== undefined || jobs.length > 0))
    issues.push({
      path: "root.providers.betterstack",
      message:
        "Log retention and heartbeats are applied through Better Stack: name the account, or drop the observability section and the heartbeat jobs",
    });

  const projects: { member: string; slug: string }[] = [];
  const owners = new Map<string, string>();
  for (const [member, app] of Object.entries(members.apps)) {
    const slug = app.telemetry?.sentryProject;
    if (slug === undefined) continue;
    const at = `apps.${member}.telemetry.sentryProject`;
    const owner = owners.get(slug);
    if (!SLUG.test(slug))
      issues.push({ path: at, message: "Expected a Sentry project slug (a-z, 0-9, - and _)" });
    else if (owner !== undefined)
      issues.push({ path: at, message: `${slug} already belongs to ${owner}` });
    owners.set(slug, member);
    projects.push({ member, slug });
  }
  const org = root.providers?.["sentry"]?.["org"];
  if (projects.length > 0 && (typeof org !== "string" || !SLUG.test(org)))
    issues.push({
      path: "root.providers.sentry.org",
      message:
        org === undefined
          ? "App members name Sentry projects, so name the organization"
          : "Expected the organization slug (public, never a ref:)",
    });

  const page = policy.statusPage;
  if (page !== undefined && !betterstack)
    issues.push({
      path: "root.providers.betterstack",
      message: "The status page is served by Better Stack: name the account",
    });
  for (const environment of page?.environments ?? [])
    if (!environments.includes(environment))
      issues.push({
        path: "root.observability.statusPage.environments",
        message: `${environment} is not a monitored environment of this runway`,
      });

  if (issues.length > 0) throw new ObservabilityConfigInvalidError("the telemetry runways", issues);

  const slis: ServiceSli[] = members.services.flatMap((service): ServiceSli[] => [
    {
      service,
      kind: SliKind.Availability,
      metric: HTTP_DURATION,
      goodWhen: "http.response.status_code < 500",
    },
    { service, kind: SliKind.Latency, metric: HTTP_DURATION, quantiles: [0.95, 0.99] },
  ]);

  return {
    project: root.project,
    environments,
    telemetry: betterstack
      ? { hotDays: policy.logs.hotDays, coldMonths: policy.logs.coldMonths }
      : null,
    heartbeats: environments.flatMap((environment) =>
      jobs.map((job) => ({
        environment,
        service: job.service,
        kind: job.kind,
        name: job.name,
        periodSeconds: job.periodSeconds,
        graceSeconds: Math.ceil(job.periodSeconds / 5),
      })),
    ),
    sentry: projects.length === 0 ? null : { org: String(org), projects },
    slis,
    slos: { startAt: policy.slos.startAt },
    statusPage:
      page === undefined
        ? null
        : {
            subdomain: page.subdomain,
            companyName: page.companyName,
            companyUrl: page.companyUrl,
            timezone: page.timezone,
            customDomain: page.customDomain ?? null,
            published: page.published,
            environments: page.environments,
          },
  };
}
