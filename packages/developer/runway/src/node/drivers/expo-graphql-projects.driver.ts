/**
 * Stackra file contract:
 * Purpose: `ExpoGraphqlProjectsDriver`, the Expo API driver of the `ExpoProjects` port: finds and creates EAS
 *          projects, reads which signing and push credentials EAS holds for an app, and hands EAS the Android FCM v1
 *          key, through the same GraphQL operations eas-cli runs (owner Q3).
 * Boundary: `fetch` only, to `https://api.expo.dev/graphql` with the job's `EXPO_TOKEN` (read per request, never
 *           kept). The FCM key goes into one mutation and is never logged or returned. Expo does not publish this API
 *           as stable: a change shows as a failing onboarding step, and the operations are re-checked on the first
 *           live run (STA-1623).
 * Runtime: node
 * Governing contract: ADR 0482 (decisions 3, 4 and 7), ADR 0062, ADR 0173.
 */
import { Driver } from "@stackra/container";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { ExpoProjects } from "#core/ports/expo-projects.port";
import type { ExpoCredentials } from "#core/types/expo-credentials.type";
import { requestJson } from "#node/functions/request-json.function";
import { secretOf } from "#node/functions/secret-of.function";

/** Expo's API. */
const URL = "https://api.expo.dev/graphql";

/** The credentials query. */
const CREDENTIALS = `query Credentials($appId: String!) {
  app {
    byId(appId: $appId) {
      ownerAccount { id }
      iosAppCredentials {
        appleAppIdentifier { bundleIdentifier }
        pushKey { id }
        iosAppBuildCredentialsList { distributionCertificate { id } provisioningProfile { id } }
      }
      androidAppCredentials {
        id
        applicationIdentifier
        googleServiceAccountKeyForFcmV1 { id }
        androidAppBuildCredentialsList { androidKeystore { id } }
      }
    }
  }
}`;

type Node = Record<string, unknown>;

/** `node.a.b…`, or `undefined`. */
function at(node: unknown, ...path: string[]): unknown {
  return path.reduce<unknown>(
    (value, key) =>
      typeof value === "object" && value !== null ? (value as Node)[key] : undefined,
    node,
  );
}

/** `value` as a list of nodes. */
function list(value: unknown): Node[] {
  return Array.isArray(value) ? (value as Node[]) : [];
}

/**
 * Expo through its API.
 *
 * @example
 * const expo = new ExpoGraphqlProjectsDriver();
 * await expo.findProject("figentra", "academorix-academorix");
 */
export class ExpoGraphqlProjectsDriver extends Driver(ExpoProjects) {
  /** The job's environment; a test replaces it. */
  env: Readonly<Record<string, string | undefined>> = process.env;

  /** `fetch`; a test replaces it. */
  fetch: typeof fetch = globalThis.fetch;

  /** The project's id, or `null` when Expo has none. */
  override async findProject(owner: string, slug: string): Promise<string | null> {
    const data = await this.graphql(
      "find project",
      `query Find($fullName: String!) { app { byFullName(fullName: $fullName) { id } } }`,
      { fullName: `@${owner}/${slug}` },
      true,
    );
    const id = at(data, "app", "byFullName", "id");
    return typeof id === "string" ? id : null;
  }

  /** Creates the project under the account `owner`. */
  override async createProject(owner: string, slug: string): Promise<string> {
    const account = at(
      await this.graphql(
        "find account",
        `query Account($name: String!) { account { byName(accountName: $name) { id } } }`,
        { name: owner },
      ),
      "account",
      "byName",
      "id",
    );
    const id = at(
      await this.graphql(
        "create project",
        `mutation Create($appInput: AppInput!) { app { createApp(appInput: $appInput) { id } } }`,
        { appInput: { accountId: account, projectName: slug } },
      ),
      "app",
      "createApp",
      "id",
    );
    if (typeof id !== "string")
      throw new RunwayUnresolvedError(`Expo: create project ${owner}/${slug}: no id`);
    return id;
  }

  /** Which credentials EAS holds for the app's bundle id and package. */
  override async credentials(
    project: string,
    bundleId: string,
    packageName: string,
  ): Promise<ExpoCredentials> {
    const app = at(
      await this.graphql("read credentials", CREDENTIALS, { appId: project }),
      "app",
      "byId",
    );
    const ios = list(at(app, "iosAppCredentials")).find(
      (item) => at(item, "appleAppIdentifier", "bundleIdentifier") === bundleId,
    );
    const android = list(at(app, "androidAppCredentials")).find(
      (item) => item["applicationIdentifier"] === packageName,
    );
    return {
      ios: {
        signing: list(at(ios, "iosAppBuildCredentialsList")).some(
          (build) =>
            at(build, "distributionCertificate", "id") !== undefined &&
            at(build, "provisioningProfile", "id") !== undefined,
        ),
        push: at(ios, "pushKey", "id") !== undefined,
      },
      android: {
        signing: list(at(android, "androidAppBuildCredentialsList")).some(
          (build) => at(build, "androidKeystore", "id") !== undefined,
        ),
        push: at(android, "googleServiceAccountKeyForFcmV1", "id") !== undefined,
      },
    };
  }

  /** Stores the key on the account and sets it as the app's FCM v1 key. */
  override async uploadFcmKey(project: string, packageName: string, key: string): Promise<void> {
    const app = at(
      await this.graphql("read credentials", CREDENTIALS, { appId: project }),
      "app",
      "byId",
    );
    let jsonKey: unknown;
    try {
      jsonKey = JSON.parse(key);
    } catch {
      throw new RunwayUnresolvedError("Expo: upload FCM key: the key is not JSON");
    }
    const keyId = at(
      await this.graphql(
        "store FCM key",
        `mutation Key($input: GoogleServiceAccountKeyInput!, $accountId: ID!) {
          googleServiceAccountKey { createGoogleServiceAccountKey(googleServiceAccountKeyInput: $input, accountId: $accountId) { id } }
        }`,
        { input: { jsonKey }, accountId: at(app, "ownerAccount", "id") },
      ),
      "googleServiceAccountKey",
      "createGoogleServiceAccountKey",
      "id",
    );
    let credentials = list(at(app, "androidAppCredentials")).find(
      (item) => item["applicationIdentifier"] === packageName,
    )?.["id"];
    if (credentials === undefined)
      credentials = at(
        await this.graphql(
          "create Android credentials",
          `mutation Android($appId: ID!, $applicationIdentifier: String!) {
            androidAppCredentials { createAndroidAppCredentials(androidAppCredentialsInput: {}, appId: $appId, applicationIdentifier: $applicationIdentifier) { id } }
          }`,
          { appId: project, applicationIdentifier: packageName },
        ),
        "androidAppCredentials",
        "createAndroidAppCredentials",
        "id",
      );
    await this.graphql(
      "set FCM v1 key",
      `mutation Set($id: ID!, $keyId: ID!) {
        androidAppCredentials { setGoogleServiceAccountKeyForFcmV1(id: $id, googleServiceAccountKeyId: $keyId) { id } }
      }`,
      { id: credentials, keyId },
    );
  }

  /** One GraphQL call; `missing` answers `{}` when Expo says the thing does not exist. */
  private async graphql(
    what: string,
    query: string,
    variables: Node,
    missing = false,
  ): Promise<Node> {
    const { body } = await requestJson(this.fetch, {
      what: `Expo: ${what}`,
      method: "POST",
      url: URL,
      headers: { authorization: `Bearer ${secretOf(this.env, "EXPO_TOKEN")}` },
      body: { query, variables },
    });
    const errors = list(body["errors"]);
    if (errors.length > 0) {
      const codes = errors.map((error) =>
        String(at(error, "extensions", "errorCode") ?? at(error, "extensions", "code") ?? ""),
      );
      if (missing && codes.some((code) => code.includes("NOT_FOUND"))) return {};
      throw new RunwayUnresolvedError(
        `Expo: ${what}: ${String(errors[0]?.["message"] ?? codes.join(", "))}`,
      );
    }
    return (body["data"] as Node | undefined) ?? {};
  }
}
