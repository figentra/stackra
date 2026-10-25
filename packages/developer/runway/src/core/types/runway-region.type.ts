/**
 * Stackra file contract:
 * Purpose: `RunwayRegion`, one region an environment deploys to, resolved from the root runway: its key, cloud, cloud
 *          region, account or project, and jurisdiction.
 * Boundary: type only; `regionsOf` builds it from a parsed root runway.
 * Runtime: isomorphic
 * Governing contract: ADR 0354 (decision 4).
 */
import type { RunwayCloud } from "#core/enums/runway-cloud.enum";

/** One resolved region. */
export interface RunwayRegion {
  /** The region key (`eu`, `me`). */
  readonly key: string;

  /** The cloud that serves it. */
  readonly cloud: RunwayCloud;

  /** The cloud's region id. */
  readonly location: string;

  /** The AWS account or GCP project, or a `ref:` path; absent when not stated. */
  readonly account?: string | number | boolean;

  /** The jurisdiction its data stays in; absent when not stated. */
  readonly jurisdiction?: string;
}
