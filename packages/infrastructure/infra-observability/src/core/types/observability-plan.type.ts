/**
 * Stackra file contract:
 * Purpose: `ObservabilityPlan`, the telemetry of a repository as `observabilityPlan` builds it: the deployed
 *          environments, the OTLP destination with its log retention, the heartbeats, the Sentry projects, the
 *          service-level indicators, when objectives start, the uptime monitors of public URLs and the status page.
 * Boundary: type only; pure data, so `stackra infra gen` can show it and `observabilityStack` can declare it.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decisions 1 to 6), ADR 0171 (decision 6: Sentry and Better Stack in the core stack),
 *                     ADR 0185 (decisions 1 and 3).
 */
import type { RunwayEnvironment } from "@stackra/runway";

import type { HeartbeatKind } from "#core/enums/heartbeat-kind.enum";
import type { ServiceSli } from "#core/types/service-sli.type";

/** The telemetry plan. */
export type ObservabilityPlan = {
  /** The root runway's `project`: the Sentry team slug and the prefix of every resource name. */
  readonly project: string;
  /** The environments that get alerts and heartbeats: every root environment except dev and preview. */
  readonly environments: readonly RunwayEnvironment[];
  /** The Better Stack OpenTelemetry source and its retention; `null` without `providers.betterstack`. */
  readonly telemetry: {
    /** Days logs stay searchable. */
    readonly hotDays: number;
    /** Months the S3 archive keeps every log; 0 keeps no archive. */
    readonly coldMonths: number;
  } | null;
  /** One per deployed environment and job whose kind is switched on. */
  readonly heartbeats: readonly {
    readonly environment: RunwayEnvironment;
    readonly service: string;
    readonly kind: HeartbeatKind;
    readonly name: string;
    readonly periodSeconds: number;
    /** A fifth of the period, rounded up: Better Stack's recommended tolerance. */
    readonly graceSeconds: number;
  }[];
  /** Crash reporting; `null` when no app member names a `telemetry.sentryProject`. */
  readonly sentry: {
    /** The organization slug, `providers.sentry.org`. */
    readonly org: string;
    /** One project per app member that names one. */
    readonly projects: readonly { readonly member: string; readonly slug: string }[];
  } | null;
  /** Availability and latency for every service member. */
  readonly slis: readonly ServiceSli[];
  /** When objectives start (`observability.slos.startAt`); none is declared before then. */
  readonly slos: { readonly startAt: "first-paying-tenant" };
  /** One Better Stack uptime monitor per `observability.uptime` entry, probing a public URL from outside. */
  readonly uptime: readonly {
    readonly environment: RunwayEnvironment;
    /** Kebab-case, unique: names the monitor and its status page entry. */
    readonly name: string;
    readonly url: string;
    readonly checkFrequencySeconds: number;
    /** The codes that mean up, or `null` for any 2xx. */
    readonly expectedStatusCodes: readonly number[] | null;
  }[];
  /** The public status page, or `null` when the runway declares none (it starts at the first external customer). */
  readonly statusPage: {
    readonly subdomain: string;
    readonly companyName: string;
    readonly companyUrl: string;
    readonly timezone: string;
    readonly customDomain: string | null;
    readonly published: boolean;
    /** The monitored environments whose heartbeats and uptime monitors the page shows, one section each. */
    readonly environments: readonly RunwayEnvironment[];
  } | null;
};
