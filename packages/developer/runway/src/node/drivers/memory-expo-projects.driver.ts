/**
 * Stackra file contract:
 * Purpose: `MemoryExpoProjectsDriver`, the in-memory driver of the `ExpoProjects` port: projects and the credentials
 *          EAS holds live in maps and every change is recorded in order.
 * Boundary: calls nothing outside the process and never records the FCM key, only that one was handed over. Seed
 *           `projects` (`<owner>/<slug>` to id) and `held` (project id to credentials) for what Expo already has.
 * Runtime: node
 * Governing contract: ADR 0482 (decisions 3 to 5).
 */
import { Driver } from "@stackra/container";

import { ExpoProjects } from "#core/ports/expo-projects.port";
import type { ExpoCredentials } from "#core/types/expo-credentials.type";

/** The credentials of a project EAS holds nothing for. */
const NONE: ExpoCredentials = {
  ios: { signing: false, push: false },
  android: { signing: false, push: false },
};

/**
 * Expo in memory.
 *
 * @example
 * const expo = new MemoryExpoProjectsDriver();
 * expo.projects.set("figentra/commerce-staff", "0f0e…");
 */
export class MemoryExpoProjectsDriver extends Driver(ExpoProjects) {
  /** Project ids by `<owner>/<slug>`. */
  readonly projects = new Map<string, string>();

  /** The credentials EAS holds, by project id. */
  readonly held = new Map<string, ExpoCredentials>();

  /** Every change, in order, as `<method> <arguments>`. */
  readonly calls: string[] = [];

  /** The project id, or `null`. */
  override async findProject(owner: string, slug: string): Promise<string | null> {
    return this.projects.get(`${owner}/${slug}`) ?? null;
  }

  /** Creates the project. */
  override async createProject(owner: string, slug: string): Promise<string> {
    this.calls.push(`createProject ${owner} ${slug}`);
    const id = `project-${this.projects.size + 1}`;
    this.projects.set(`${owner}/${slug}`, id);
    return id;
  }

  /** What EAS holds for the project; nothing when unseeded. */
  override async credentials(project: string): Promise<ExpoCredentials> {
    return this.held.get(project) ?? NONE;
  }

  /** Marks the Android push key held; the key itself is not kept. */
  override async uploadFcmKey(project: string, packageName: string): Promise<void> {
    this.calls.push(`uploadFcmKey ${project} ${packageName}`);
    const held = this.held.get(project) ?? NONE;
    this.held.set(project, { ...held, android: { ...held.android, push: true } });
  }
}
