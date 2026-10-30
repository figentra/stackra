/**
 * Stackra file contract:
 * Purpose: `SentryApiProjectsDriver`, the Sentry API driver of the `SentryProjects` port: reads a project's client
 *          keys for its DSN, and creates a React Native project for a team.
 * Boundary: `fetch` only, with the job's `SENTRY_AUTH_TOKEN` (an organisation token with `project:write`), read per
 *           request. The API base is `MOBILE_ONBOARD_SETTINGS.sentryApi`. A DSN is public.
 * Runtime: node
 * Governing contract: ADR 0482 (decision 6), ADR 0062.
 */
import { Driver } from "@stackra/container";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { SentryProjects } from "#core/ports/sentry-projects.port";
import { MOBILE_ONBOARD_SETTINGS } from "#node/constants/mobile-onboard-settings.constant";
import { requestJson } from "#node/functions/request-json.function";
import { secretOf } from "#node/functions/secret-of.function";

/**
 * Sentry through its API.
 *
 * @example
 * const sentry = new SentryApiProjectsDriver();
 * await sentry.findProject("figentra", "academorix-academorix");
 */
export class SentryApiProjectsDriver extends Driver(SentryProjects) {
  /** The job's environment; a test replaces it. */
  env: Readonly<Record<string, string | undefined>> = process.env;

  /** `fetch`; a test replaces it. */
  fetch: typeof fetch = globalThis.fetch;

  /** The DSN of the project's first client key, or `null` when there is no project. */
  override async findProject(org: string, slug: string): Promise<string | null> {
    const { status, body } = await requestJson(this.fetch, {
      what: "Sentry: read client keys",
      method: "GET",
      url: `${MOBILE_ONBOARD_SETTINGS.sentryApi}/projects/${org}/${slug}/keys/`,
      headers: this.headers(),
      accept: [404],
    });
    if (status === 404) return null;
    const keys = Array.isArray(body["items"])
      ? (body["items"] as { dsn?: { public?: unknown } }[])
      : [];
    const dsn = keys[0]?.dsn?.public;
    if (typeof dsn !== "string")
      throw new RunwayUnresolvedError(`Sentry: ${org}/${slug} has no client key`);
    return dsn;
  }

  /** Creates the project and answers its DSN. */
  override async createProject(org: string, team: string, slug: string): Promise<string> {
    await requestJson(this.fetch, {
      what: "Sentry: create project",
      method: "POST",
      url: `${MOBILE_ONBOARD_SETTINGS.sentryApi}/teams/${org}/${team}/projects/`,
      headers: this.headers(),
      body: { name: slug, slug, platform: "react-native" },
    });
    const dsn = await this.findProject(org, slug);
    if (dsn === null) throw new RunwayUnresolvedError(`Sentry: ${org}/${slug} was not created`);
    return dsn;
  }

  /** The bearer header. */
  private headers(): Record<string, string> {
    return { authorization: `Bearer ${secretOf(this.env, "SENTRY_AUTH_TOKEN")}` };
  }
}
