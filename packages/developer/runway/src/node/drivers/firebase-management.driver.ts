/**
 * Stackra file contract:
 * Purpose: `FirebaseManagementDriver`, the Firebase Management API driver of the `Firebase` port: adds Firebase to a
 *          Google project, finds and registers its iOS and Android apps, fetches their config files, and links Google
 *          Analytics.
 * Boundary: `fetch` only, with the same federated access token as `GoogleCloudDriver` (`GOOGLE_OAUTH_ACCESS_TOKEN`).
 *           Linking Analytics answers false on 403: the identity lacks the owner's one-time Analytics grant.
 * Runtime: node
 * Governing contract: ADR 0482 (decision 5).
 */
import { Driver } from "@stackra/container";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { Firebase } from "#core/ports/firebase.port";
import { MOBILE_ONBOARD_SETTINGS } from "#node/constants/mobile-onboard-settings.constant";
import { awaitOperation } from "#node/functions/await-operation.function";
import { requestJson } from "#node/functions/request-json.function";
import { secretOf } from "#node/functions/secret-of.function";
import type { JsonAnswer } from "#node/types/json-answer.type";

/** The Firebase Management API. */
const BASE = "https://firebase.googleapis.com/v1beta1";

/** The two app platforms, with their collection and id field. */
const APPS = {
  ios: { collection: "iosApps", field: "bundleId" },
  android: { collection: "androidApps", field: "packageName" },
} as const;

/**
 * Firebase through its Management API.
 *
 * @example
 * const firebase = new FirebaseManagementDriver();
 * await firebase.hasFirebase("academorix");
 */
export class FirebaseManagementDriver extends Driver(Firebase) {
  /** The job's environment; a test replaces it. */
  env: Readonly<Record<string, string | undefined>> = process.env;

  /** `fetch`; a test replaces it. */
  fetch: typeof fetch = globalThis.fetch;

  /** Milliseconds between operation polls; a test sets 0. */
  intervalMs = 2000;

  /** Whether the project is a Firebase project. */
  override async hasFirebase(project: string): Promise<boolean> {
    return (
      (await this.call("read project", "GET", `/projects/${project}`, undefined, [403, 404]))
        .status === 200
    );
  }

  /** Adds Firebase to the project. */
  override async addFirebase(project: string): Promise<void> {
    const { status, body } = await this.call(
      "add Firebase",
      "POST",
      `/projects/${project}:addFirebase`,
      {},
      [409],
    );
    if (status !== 409) await this.operation("add Firebase", body["name"]);
  }

  /** The app id of the platform app, or `null`. */
  override async findApp(
    project: string,
    platform: "ios" | "android",
    identifier: string,
  ): Promise<string | null> {
    const { collection, field } = APPS[platform];
    const { body } = await this.call(
      "list apps",
      "GET",
      `/projects/${project}/${collection}?pageSize=100`,
    );
    const apps = Array.isArray(body["apps"]) ? (body["apps"] as Record<string, unknown>[]) : [];
    const app = apps.find((item) => item[field] === identifier);
    return typeof app?.["appId"] === "string" ? app["appId"] : null;
  }

  /** Registers the platform app. */
  override async createApp(
    project: string,
    platform: "ios" | "android",
    identifier: string,
    name: string,
  ): Promise<string> {
    const { collection, field } = APPS[platform];
    const { body } = await this.call("register app", "POST", `/projects/${project}/${collection}`, {
      [field]: identifier,
      displayName: name,
    });
    const appId = (await this.operation("register app", body["name"])).response?.["appId"];
    if (typeof appId !== "string")
      throw new RunwayUnresolvedError(`Firebase: register ${identifier}: no app id`);
    return appId;
  }

  /** The decoded config file of the app. */
  override async configFile(
    project: string,
    platform: "ios" | "android",
    appId: string,
  ): Promise<string> {
    const { body } = await this.call(
      "read config file",
      "GET",
      `/projects/${project}/${APPS[platform].collection}/${appId}/config`,
    );
    const contents = body["configFileContents"];
    if (typeof contents !== "string")
      throw new RunwayUnresolvedError(`Firebase: config file of ${appId}: empty`);
    return Buffer.from(contents, "base64").toString("utf8");
  }

  /** Whether the project is linked to Google Analytics. */
  override async analyticsLinked(project: string): Promise<boolean> {
    return (
      (
        await this.call(
          "read Analytics link",
          "GET",
          `/projects/${project}/analyticsDetails`,
          undefined,
          [404],
        )
      ).status === 200
    );
  }

  /** Links the project to the Analytics account; false without the grant. */
  override async linkAnalytics(project: string, account: string): Promise<boolean> {
    const { status, body } = await this.call(
      "link Analytics",
      "POST",
      `/projects/${project}:addGoogleAnalytics`,
      { analyticsAccountId: account },
      [403],
    );
    if (status === 403) return false;
    await this.operation("link Analytics", body["name"]);
    return true;
  }

  /** One authorised request. */
  private call(
    what: string,
    method: string,
    path: string,
    body?: unknown,
    accept?: readonly number[],
  ): Promise<JsonAnswer> {
    return requestJson(this.fetch, {
      what: `Firebase: ${what}`,
      method,
      url: `${BASE}${path}`,
      headers: this.headers(),
      ...(body === undefined ? {} : { body }),
      ...(accept === undefined ? {} : { accept }),
    });
  }

  /** Waits for the operation `name`, throwing on its error. */
  private async operation(what: string, name: unknown) {
    const outcome = await awaitOperation(this.fetch, {
      what: `Firebase: ${what}`,
      base: BASE,
      name: String(name),
      headers: this.headers(),
      intervalMs: this.intervalMs,
    });
    if (outcome.error !== undefined)
      throw new RunwayUnresolvedError(`Firebase: ${what}: ${String(outcome.error["message"])}`);
    return outcome;
  }

  /** The bearer header. */
  private headers(): Record<string, string> {
    return { authorization: `Bearer ${secretOf(this.env, MOBILE_ONBOARD_SETTINGS.googleToken)}` };
  }
}
