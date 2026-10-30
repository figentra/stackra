/**
 * Stackra file contract:
 * Purpose: unit tests of the real store drivers of mobile onboarding against a fake `fetch`: App Store Connect signs an
 *          ES256 token and reads and registers bundle ids; Play opens, reads and closes an edit (404 is no app); Expo
 *          finds a project (NOT_FOUND is none), reads credentials and hands over the FCM key; Google Cloud creates a
 *          project (409 is taken), grants a role and decodes a created key; Firebase reads a config file and answers
 *          false on a 403 Analytics link; Sentry reads a DSN; Infisical writes blind and replaces an existing secret.
 *          No secret value from the environment or a key appears in any error.
 * Boundary: test only; every request goes to the fake, which answers by method and URL; keys are generated in the test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0482 (decisions 4 to 7); ADR 0173.
 */
import { generateKeyPairSync } from "node:crypto";

import { describe, expect, it } from "@stackra/testing";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { AscAppleDeveloperDriver } from "#node/drivers/asc-apple-developer.driver";
import { ExpoGraphqlProjectsDriver } from "#node/drivers/expo-graphql-projects.driver";
import { FirebaseManagementDriver } from "#node/drivers/firebase-management.driver";
import { GoogleCloudDriver } from "#node/drivers/google-cloud.driver";
import { GooglePlayConsoleDriver } from "#node/drivers/google-play-console.driver";
import { InfisicalVaultWriterDriver } from "#node/drivers/infisical-vault-writer.driver";
import { SentryApiProjectsDriver } from "#node/drivers/sentry-api-projects.driver";

/** One recorded request. */
type Sent = {
  readonly method: string;
  readonly url: string;
  readonly body?: string;
  readonly auth?: string;
};

/** A fake `fetch` answering `<METHOD> <url prefix>` keys in order of length, recording every request. */
function fakeFetch(answers: Record<string, [number, unknown]>): {
  fetch: typeof fetch;
  sent: Sent[];
} {
  const sent: Sent[] = [];
  const keys = Object.keys(answers).sort((a, b) => b.length - a.length);
  const fake = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const method = init?.method ?? "GET";
    const url = String(input);
    const headers = (init?.headers ?? {}) as Record<string, string>;
    sent.push({
      method,
      url,
      ...(typeof init?.body === "string" ? { body: init.body } : {}),
      ...(headers["authorization"] === undefined ? {} : { auth: headers["authorization"] }),
    });
    const key = keys.find((candidate) => `${method} ${url}`.startsWith(candidate));
    const [status, body] =
      key === undefined ? [599, { message: "unexpected" }] : (answers[key] as [number, unknown]);
    return new Response(body === undefined ? "" : JSON.stringify(body), { status });
  };
  return { fetch: fake as typeof fetch, sent };
}

const SECRET = "secret-canary-value";

describe("AscAppleDeveloperDriver", () => {
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const env = {
    ASC_API_KEY_ID: "KEY1",
    ASC_API_ISSUER_ID: "issuer",
    ASC_API_PRIVATE_KEY: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  };

  // @covers sta-1623:FR-003
  it("finds a bundle id with its capabilities and registers one with a signed token", async () => {
    const { fetch, sent } = fakeFetch({
      "GET https://api.appstoreconnect.apple.com/v1/bundleIds?": [
        200,
        { data: [{ id: "B1", attributes: { identifier: "com.figentra.commerce.staff" } }] },
      ],
      "GET https://api.appstoreconnect.apple.com/v1/bundleIds/B1/bundleIdCapabilities": [
        200,
        { data: [{ attributes: { capabilityType: "PUSH_NOTIFICATIONS" } }] },
      ],
      "POST https://api.appstoreconnect.apple.com/v1/bundleIds": [201, { data: { id: "B2" } }],
      "GET https://api.appstoreconnect.apple.com/v1/apps?": [200, { data: [] }],
    });
    const apple = Object.assign(new AscAppleDeveloperDriver(), { env, fetch, now: () => 0 });

    expect(await apple.findBundle("com.figentra.commerce.staff")).toEqual({
      id: "B1",
      capabilities: ["PUSH_NOTIFICATIONS"],
    });
    expect(await apple.registerBundle("com.figentra.commerce.kiosk", "Kiosk")).toBe("B2");
    expect(await apple.findApp("com.figentra.commerce.staff")).toBeNull();
    const [head] = (sent[0]?.auth ?? "").replace("Bearer ", "").split(".");
    expect(JSON.parse(Buffer.from(head ?? "", "base64url").toString())).toEqual({
      alg: "ES256",
      kid: "KEY1",
      typ: "JWT",
    });
  });

  it("names a missing key variable and never a value", async () => {
    const apple = Object.assign(new AscAppleDeveloperDriver(), {
      env: {},
      fetch: fakeFetch({}).fetch,
    });

    await expect(apple.findApp("x.y")).rejects.toThrow(/ASC_API_KEY_ID is not set/);
  });
});

describe("GooglePlayConsoleDriver", () => {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const env = {
    GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: JSON.stringify({
      client_email: "release@figentra.iam.gserviceaccount.com",
      private_key: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
      token_uri: "https://oauth2.googleapis.com/token",
    }),
  };
  const app =
    "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.figentra.commerce.staff";

  // @covers sta-1623:FR-009
  it("reads whether a track has a release and closes the edit", async () => {
    const { fetch, sent } = fakeFetch({
      "POST https://oauth2.googleapis.com/token": [200, { access_token: "t" }],
      [`POST ${app}/edits`]: [200, { id: "E1" }],
      [`GET ${app}/edits/E1/tracks`]: [
        200,
        { tracks: [{ track: "internal", releases: [{ versionCodes: ["7"] }] }] },
      ],
      [`DELETE ${app}/edits/E1`]: [204, undefined],
    });
    const play = Object.assign(new GooglePlayConsoleDriver(), { env, fetch });

    expect(await play.findApp("com.figentra.commerce.staff")).toEqual({ hasRelease: true });
    expect(sent.at(-1)?.method).toBe("DELETE");
  });

  it("answers null for a package Play does not know", async () => {
    const { fetch } = fakeFetch({
      "POST https://oauth2.googleapis.com/token": [200, { access_token: "t" }],
      [`POST ${app}/edits`]: [404, { error: { message: "Package not found" } }],
    });
    const play = Object.assign(new GooglePlayConsoleDriver(), { env, fetch });

    expect(await play.findApp("com.figentra.commerce.staff")).toBeNull();
  });
});

describe("ExpoGraphqlProjectsDriver", () => {
  const env = { EXPO_TOKEN: SECRET };

  it("answers null for a project Expo does not have", async () => {
    const { fetch } = fakeFetch({
      "POST https://api.expo.dev/graphql": [
        200,
        { errors: [{ message: "no such app", extensions: { errorCode: "EXPERIENCE_NOT_FOUND" } }] },
      ],
    });
    const expo = Object.assign(new ExpoGraphqlProjectsDriver(), { env, fetch });

    expect(await expo.findProject("figentra", "commerce-staff")).toBeNull();
  });

  it("reads which credentials EAS holds and sends the FCM key only in the mutation", async () => {
    const app = {
      ownerAccount: { id: "A1" },
      iosAppCredentials: [
        {
          appleAppIdentifier: { bundleIdentifier: "com.figentra.commerce.staff" },
          pushKey: null,
          iosAppBuildCredentialsList: [
            { distributionCertificate: { id: "c" }, provisioningProfile: { id: "p" } },
          ],
        },
      ],
      androidAppCredentials: [
        {
          id: "AC1",
          applicationIdentifier: "com.figentra.commerce.staff",
          googleServiceAccountKeyForFcmV1: null,
          androidAppBuildCredentialsList: [{ androidKeystore: { id: "k" } }],
        },
      ],
    };
    const { fetch, sent } = fakeFetch({
      "POST https://api.expo.dev/graphql": [
        200,
        {
          data: {
            app: { byId: app },
            googleServiceAccountKey: { createGoogleServiceAccountKey: { id: "G1" } },
            androidAppCredentials: { setGoogleServiceAccountKeyForFcmV1: { id: "AC1" } },
          },
        },
      ],
    });
    const expo = Object.assign(new ExpoGraphqlProjectsDriver(), { env, fetch });

    expect(
      await expo.credentials("P1", "com.figentra.commerce.staff", "com.figentra.commerce.staff"),
    ).toEqual({
      ios: { signing: true, push: false },
      android: { signing: true, push: false },
    });
    await expo.uploadFcmKey(
      "P1",
      "com.figentra.commerce.staff",
      JSON.stringify({ private_key: "fcm-canary" }),
    );
    expect(sent.filter((request) => request.body?.includes("fcm-canary") === true)).toHaveLength(1);
    expect(sent.at(-1)?.body).toContain("setGoogleServiceAccountKeyForFcmV1");
  });
});

describe("GoogleCloudDriver", () => {
  const env = { GOOGLE_OAUTH_ACCESS_TOKEN: SECRET, GOOGLE_PROJECT_FOLDER: "folders/42" };
  const manager = "https://cloudresourcemanager.googleapis.com/v3";

  it("answers false when the project id is taken", async () => {
    const { fetch } = fakeFetch({
      [`POST ${manager}/projects`]: [409, { error: { message: "exists" } }],
    });
    const google = Object.assign(new GoogleCloudDriver(), { env, fetch, intervalMs: 0 });

    expect(await google.createProject("commerce", "Commerce")).toBe(false);
  });

  it("creates a project, enables its APIs, grants a role once and decodes a key", async () => {
    const key = JSON.stringify({ type: "service_account" });
    const { fetch, sent } = fakeFetch({
      [`POST ${manager}/projects/commerce:`]: [200, { bindings: [] }],
      [`POST ${manager}/projects`]: [200, { name: "operations/cp.1" }],
      [`GET ${manager}/operations/cp.1`]: [200, { done: true, response: {} }],
      "POST https://serviceusage.googleapis.com/v1/projects/commerce/services:batchEnable": [
        200,
        { name: "operations/su.1" },
      ],
      "GET https://serviceusage.googleapis.com/v1/operations/su.1": [200, { done: true }],
      "GET https://iam.googleapis.com/v1/projects/commerce/serviceAccounts/": [404, {}],
      "POST https://iam.googleapis.com/v1/projects/commerce/serviceAccounts/eas-fcm@commerce.iam.gserviceaccount.com/keys":
        [200, { privateKeyData: Buffer.from(key).toString("base64") }],
      "POST https://iam.googleapis.com/v1/projects/commerce/serviceAccounts": [200, {}],
    });
    const google = Object.assign(new GoogleCloudDriver(), { env, fetch, intervalMs: 0 });

    expect(await google.createProject("commerce", "Commerce")).toBe(true);
    expect(
      await google.ensureServiceAccount(
        "commerce",
        "eas-fcm",
        "roles/firebasecloudmessaging.admin",
      ),
    ).toBe("eas-fcm@commerce.iam.gserviceaccount.com");
    expect(sent.find((request) => request.url.endsWith(":setIamPolicy"))?.body).toContain(
      "serviceAccount:eas-fcm@commerce.iam.gserviceaccount.com",
    );
    expect(await google.createKey("commerce", "eas-fcm@commerce.iam.gserviceaccount.com")).toBe(
      key,
    );
    expect(JSON.parse(sent[0]?.body ?? "{}")).toMatchObject({
      projectId: "commerce",
      parent: "folders/42",
    });
  });

  it("refuses a folder that is not folders/<number>", async () => {
    const google = Object.assign(new GoogleCloudDriver(), {
      env: { GOOGLE_OAUTH_ACCESS_TOKEN: SECRET },
      fetch: fakeFetch({}).fetch,
    });

    await expect(google.createProject("commerce", "Commerce")).rejects.toBeInstanceOf(
      RunwayUnresolvedError,
    );
  });
});

describe("FirebaseManagementDriver", () => {
  const env = { GOOGLE_OAUTH_ACCESS_TOKEN: SECRET };
  const base = "https://firebase.googleapis.com/v1beta1/projects/commerce";

  it("decodes a config file, finds an app and answers false without the Analytics grant", async () => {
    const { fetch } = fakeFetch({
      [`GET ${base}/androidApps?`]: [
        200,
        { apps: [{ appId: "1:2:android:3", packageName: "com.figentra.commerce.staff" }] },
      ],
      [`GET ${base}/androidApps/1:2:android:3/config`]: [
        200,
        { configFileContents: Buffer.from('{"project_info":{}}').toString("base64") },
      ],
      [`POST ${base}:addGoogleAnalytics`]: [403, { error: { message: "denied" } }],
    });
    const firebase = Object.assign(new FirebaseManagementDriver(), { env, fetch, intervalMs: 0 });

    expect(await firebase.findApp("commerce", "android", "com.figentra.commerce.staff")).toBe(
      "1:2:android:3",
    );
    expect(await firebase.configFile("commerce", "android", "1:2:android:3")).toBe(
      '{"project_info":{}}',
    );
    expect(await firebase.linkAnalytics("commerce", "123")).toBe(false);
  });
});

describe("SentryApiProjectsDriver", () => {
  it("reads the DSN of a project and answers null for none", async () => {
    const { fetch } = fakeFetch({
      "GET https://sentry.io/api/0/projects/figentra/commerce-staff/keys/": [
        200,
        [{ dsn: { public: "https://k@o1.ingest.sentry.io/2" } }],
      ],
      "GET https://sentry.io/api/0/projects/figentra/nope/keys/": [404, { detail: "missing" }],
    });
    const sentry = Object.assign(new SentryApiProjectsDriver(), {
      env: { SENTRY_AUTH_TOKEN: SECRET },
      fetch,
    });

    expect(await sentry.findProject("figentra", "commerce-staff")).toBe(
      "https://k@o1.ingest.sentry.io/2",
    );
    expect(await sentry.findProject("figentra", "nope")).toBeNull();
  });
});

describe("InfisicalVaultWriterDriver", () => {
  const env = { INFISICAL_TOKEN: SECRET, INFISICAL_PROJECT_ID: "W1" };

  // @covers sta-1623:FR-006
  it("creates the folders and replaces a secret that exists, never putting the value in an error", async () => {
    const { fetch, sent } = fakeFetch({
      "POST https://app.infisical.com/api/v1/folders": [400, { message: "exists" }],
      "POST https://app.infisical.com/api/v3/secrets/raw/FCM_SERVICE_ACCOUNT_JSON": [
        400,
        { message: "exists" },
      ],
      "PATCH https://app.infisical.com/api/v3/secrets/raw/FCM_SERVICE_ACCOUNT_JSON": [200, {}],
    });
    const vault = Object.assign(new InfisicalVaultWriterDriver(), { env, fetch });

    await vault.write("prod:/ci/store/commerce", "FCM_SERVICE_ACCOUNT_JSON", "value-canary");

    expect(sent.filter((request) => request.url.endsWith("/folders"))).toHaveLength(3);
    expect(JSON.parse(sent.at(-1)?.body ?? "{}")).toMatchObject({
      environment: "prod",
      secretPath: "/ci/store/commerce",
      secretValue: "value-canary",
    });
  });

  it("names the step and status of a failure without the value", async () => {
    const { fetch } = fakeFetch({
      "POST https://app.infisical.com/api/v1/folders": [400, {}],
      "POST https://app.infisical.com/api/v3/secrets/raw/X": [500, { message: "down" }],
    });
    const vault = Object.assign(new InfisicalVaultWriterDriver(), { env, fetch });

    const failure = await vault
      .write("prod:/ci", "X", "value-canary")
      .catch((error: unknown) => error);
    expect(String(failure)).toContain("HTTP 500");
    expect(String(failure)).not.toContain("value-canary");
    expect(String(failure)).not.toContain(SECRET);
  });
});
