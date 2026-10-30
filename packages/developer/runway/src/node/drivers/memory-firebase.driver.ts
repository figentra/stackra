/**
 * Stackra file contract:
 * Purpose: `MemoryFirebaseDriver`, the in-memory driver of the `Firebase` port: Firebase projects, apps and Analytics
 *          links live in sets and maps, and every change is recorded in order.
 * Boundary: calls nothing outside the process. Seed `projects`, `apps` (`<project>/<platform>/<identifier>` to app id)
 *           and `linked` for what Firebase already has; `mayLink` false stands for the missing Analytics grant.
 * Runtime: node
 * Governing contract: ADR 0482 (decision 5).
 */
import { Driver } from "@stackra/container";

import { Firebase } from "#core/ports/firebase.port";

/**
 * Firebase in memory.
 *
 * @example
 * const firebase = new MemoryFirebaseDriver();
 * firebase.projects.add("academorix");
 */
export class MemoryFirebaseDriver extends Driver(Firebase) {
  /** Google projects with Firebase on. */
  readonly projects = new Set<string>();

  /** App ids by `<project>/<platform>/<identifier>`. */
  readonly apps = new Map<string, string>();

  /** Projects linked to Analytics. */
  readonly linked = new Set<string>();

  /** Every change, in order, as `<method> <arguments>`. */
  readonly calls: string[] = [];

  /** Whether the identity holds the Analytics grant. */
  mayLink = true;

  /** Whether Firebase is on. */
  override async hasFirebase(project: string): Promise<boolean> {
    return this.projects.has(project);
  }

  /** Turns Firebase on. */
  override async addFirebase(project: string): Promise<void> {
    this.calls.push(`addFirebase ${project}`);
    this.projects.add(project);
  }

  /** The app id, or `null`. */
  override async findApp(
    project: string,
    platform: "ios" | "android",
    identifier: string,
  ): Promise<string | null> {
    return this.apps.get(`${project}/${platform}/${identifier}`) ?? null;
  }

  /** Registers the app. */
  override async createApp(
    project: string,
    platform: "ios" | "android",
    identifier: string,
    name: string,
  ): Promise<string> {
    this.calls.push(`createApp ${project} ${platform} ${identifier} ${name}`);
    const id = `1:000000000000:${platform}:${this.apps.size + 1}`;
    this.apps.set(`${project}/${platform}/${identifier}`, id);
    return id;
  }

  /** A stand-in config file naming the app. */
  override async configFile(
    project: string,
    platform: "ios" | "android",
    appId: string,
  ): Promise<string> {
    return platform === "ios"
      ? `<plist><dict><key>GOOGLE_APP_ID</key><string>${appId}</string><key>PROJECT_ID</key><string>${project}</string></dict></plist>\n`
      : `${JSON.stringify({ project_info: { project_id: project }, client: [{ client_info: { mobilesdk_app_id: appId } }] }, null, 2)}\n`;
  }

  /** Whether Analytics is linked. */
  override async analyticsLinked(project: string): Promise<boolean> {
    return this.linked.has(project);
  }

  /** Links Analytics unless `mayLink` is false. */
  override async linkAnalytics(project: string, account: string): Promise<boolean> {
    if (!this.mayLink) return false;
    this.calls.push(`linkAnalytics ${project} ${account}`);
    this.linked.add(project);
    return true;
  }
}
