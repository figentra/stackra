/**
 * Stackra file contract:
 * Purpose: the `SentryProjects` port: find or create one app's Sentry project and answer its DSN.
 * Boundary: an abstract class that is its own token; the real driver calls the Sentry API with the job's
 *           `SENTRY_AUTH_TOKEN`, the memory driver keeps state in the process. A DSN is public configuration (ADR 0062
 *           decision 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0482 (decision 6), ADR 0062, ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";

/** Sentry's project side. */
export abstract class SentryProjects extends Port {
  /** The DSN of the project `slug` in organisation `org`, or `null` when there is none. */
  abstract findProject(org: string, slug: string): Promise<string | null>;

  /** Creates the project `slug` for team `team` in `org` and answers its DSN. */
  abstract createProject(org: string, team: string, slug: string): Promise<string>;
}
