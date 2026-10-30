/**
 * Stackra file contract:
 * Purpose: `MemorySentryProjectsDriver`, the in-memory driver of the `SentryProjects` port: DSNs by `<org>/<slug>` in
 *          a map, and every creation recorded in order.
 * Boundary: calls nothing outside the process. Seed `projects` for what Sentry already has.
 * Runtime: node
 * Governing contract: ADR 0482 (decision 6).
 */
import { Driver } from "@stackra/container";

import { SentryProjects } from "#core/ports/sentry-projects.port";

/**
 * Sentry in memory.
 *
 * @example
 * const sentry = new MemorySentryProjectsDriver();
 * sentry.projects.set("figentra/academorix-academorix", "https://key@o1.ingest.sentry.io/1");
 */
export class MemorySentryProjectsDriver extends Driver(SentryProjects) {
  /** DSNs by `<org>/<slug>`. */
  readonly projects = new Map<string, string>();

  /** Every creation, in order. */
  readonly calls: string[] = [];

  /** The DSN, or `null`. */
  override async findProject(org: string, slug: string): Promise<string | null> {
    return this.projects.get(`${org}/${slug}`) ?? null;
  }

  /** Creates the project with a stand-in DSN. */
  override async createProject(org: string, team: string, slug: string): Promise<string> {
    this.calls.push(`createProject ${org} ${team} ${slug}`);
    const dsn = `https://public@o0.ingest.sentry.io/${this.projects.size + 1}`;
    this.projects.set(`${org}/${slug}`, dsn);
    return dsn;
  }
}
