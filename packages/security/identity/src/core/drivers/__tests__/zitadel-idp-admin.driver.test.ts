/**
 * Stackra file contract:
 * Purpose: unit tests of `ZitadelIdpAdminDriver`: it refuses to start without a URL and token; each operation sends the
 *          right method, path, organisation header, bearer token and body (v2 users and sessions, management machine
 *          users, secrets and login policy, the OAuth device endpoints); a 409 is `IdpUserExistsError`, a 5xx, a 429 or a
 *          network failure `IdpAdminUnavailableError`, another 4xx an `Error` with no body; ending a gone session
 *          succeeds; ending a user's sessions searches and deletes each; listing them pages the search and keeps
 *          id, times and the device's description only; a device poll maps the RFC 8628 errors; a
 *          user's authentication methods come back as unique `amr` codes; a policy's providers and second factors are
 *          brought to exactly the listed ones; a user is created with and found by its `stackra_user_id` metadata;
 *          passkey sign-in and registration send the v2 session and passkey calls, unwrap `publicKey`, and turn a
 *          refusal or an unknown login or user into `UnauthenticatedError`, while a 403 stays an `Error`.
 * Boundary: test only; a scripted global fetch records each request and answers from a queue.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; RFC 8628; ADR 0410 (STA-834); STA-1264; STA-1263; STA-1538; STA-1543; STA-1580.
 */
import { buildConfig } from "@stackra/config";
import { UnauthenticatedError } from "@stackra/errors";
import { SecretStore } from "@stackra/config/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { IdpAdminConfig } from "#config/idp-admin.config";
import { DeviceTokenStatus, IdpSecondFactor } from "#contracts/index";
import { ZitadelIdpAdminDriver } from "#core/drivers/zitadel-idp-admin.driver";
import { IdpAdminUnavailableError } from "#core/errors/idp-admin-unavailable.error";
import { IdpUserExistsError } from "#core/errors/idp-user-exists.error";

/** One recorded request. */
interface Sent {
  readonly url: string;
  readonly method: string;
  readonly headers: Record<string, string>;
  readonly body: string | undefined;
}

/** A fetch that answers from `answers` in order and records every request. */
function scripted(answers: readonly (readonly [number, object | string] | Error)[]) {
  const sent: Sent[] = [];
  let next = 0;
  const fetcher = (async (input: string, init: RequestInit) => {
    sent.push({
      url: input,
      method: init.method ?? "GET",
      headers: init.headers as Record<string, string>,
      body: init.body as string | undefined,
    });
    const answer = answers[next++];
    if (answer === undefined) throw new Error("no scripted answer left");
    if (answer instanceof Error) throw answer;
    const [status, body] = answer;
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
  return { fetcher, sent };
}

/** Holds the admin token, a `@Secret` the config reads from the store only. */
class AdminTokenSecrets extends SecretStore {
  get(name: string): string | undefined {
    return name === "IDENTITY_IDP_ADMIN_TOKEN" ? "pat_1" : undefined;
  }
}

/** The driver over `answers`, against https://id.acme.example. */
function driverWith(answers: readonly (readonly [number, object | string] | Error)[]) {
  const config = buildConfig(IdpAdminConfig, {
    values: { url: "https://id.acme.example/" },
    secrets: new AdminTokenSecrets(),
  });
  const { fetcher, sent } = scripted(answers);
  vi.stubGlobal("fetch", fetcher);
  return { idp: new ZitadelIdpAdminDriver(config), sent };
}

describe(ZitadelIdpAdminDriver, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("refuses to start without a URL and a token", () => {
    expect(() => new ZitadelIdpAdminDriver(buildConfig(IdpAdminConfig))).toThrow(TypeError);
  });

  it("creates a human user through the v2 user service", async () => {
    const { idp, sent } = driverWith([[201, { userId: "u_1" }]]);
    const userId = await idp.createUser({
      organizationId: "org_1",
      username: "rana",
      givenName: "Rana",
      familyName: "Haddad",
      email: "rana@acme.example",
      emailVerified: true,
    });
    expect(userId).toBe("u_1");
    expect(sent[0]).toMatchObject({
      url: "https://id.acme.example/v2/users/human",
      method: "POST",
      headers: { authorization: "Bearer pat_1", "content-type": "application/json" },
    });
    expect(JSON.parse(sent[0]?.body ?? "")).toEqual({
      username: "rana",
      organization: { orgId: "org_1" },
      profile: { givenName: "Rana", familyName: "Haddad" },
      email: { email: "rana@acme.example", isVerified: true },
    });
  });

  it("creates a machine user and its secret in the organisation", async () => {
    const { idp, sent } = driverWith([
      [200, { userId: "m_1" }],
      [200, { clientId: "till_7", clientSecret: "s3cret" }],
    ]);
    expect(
      await idp.createMachineUser({ organizationId: "org_1", username: "till_7", name: "Till 7" }),
    ).toEqual({ userId: "m_1", clientId: "till_7", clientSecret: "s3cret" });
    expect(sent.map((request) => [request.method, request.url])).toEqual([
      ["POST", "https://id.acme.example/management/v1/users/machine"],
      ["PUT", "https://id.acme.example/management/v1/users/m_1/secret"],
    ]);
    expect(sent.every((request) => request.headers["x-zitadel-orgid"] === "org_1")).toBe(true);
  });

  it("maps 409, 5xx, 429, a network failure and other 4xx", async () => {
    const input = {
      organizationId: "org_1",
      username: "r",
      givenName: "R",
      familyName: "H",
      email: "r@a.example",
    };
    await expect(driverWith([[409, {}]]).idp.createUser(input)).rejects.toBeInstanceOf(
      IdpUserExistsError,
    );
    await expect(driverWith([[503, {}]]).idp.createUser(input)).rejects.toBeInstanceOf(
      IdpAdminUnavailableError,
    );
    await expect(driverWith([[429, {}]]).idp.removeUser("u_1")).rejects.toBeInstanceOf(
      IdpAdminUnavailableError,
    );
    const offline = driverWith([new TypeError("fetch failed")]).idp;
    await expect(offline.removeUser("u_1")).rejects.toBeInstanceOf(IdpAdminUnavailableError);
    const forbidden = driverWith([[403, { message: "secret detail" }]]).idp;
    await expect(forbidden.deactivateUser("u_1")).rejects.toThrow(
      "ZITADEL answered 403 to POST /v2/users/u_1/deactivate",
    );
  });

  it("ends a gone session quietly, and every session of a user", async () => {
    await expect(driverWith([[404, {}]]).idp.endSession("s_gone")).resolves.toBeUndefined();
    const { idp, sent } = driverWith([
      [200, { sessions: [{ id: "s_1" }, { id: "s_2" }] }],
      [200, {}],
      [200, {}],
    ]);
    expect(await idp.endSessions("u_1")).toBe(2);
    expect(JSON.parse(sent[0]?.body ?? "")).toMatchObject({
      queries: [{ userIdQuery: { id: "u_1" } }],
    });
    expect(sent.slice(1).map((request) => [request.method, request.url])).toEqual([
      ["DELETE", "https://id.acme.example/v2/sessions/s_1"],
      ["DELETE", "https://id.acme.example/v2/sessions/s_2"],
    ]);
  });

  it("lists a user's sessions page by page with their times and device", async () => {
    const full = Array.from({ length: 100 }, (_, index) => ({
      id: `s_${index}`,
      creationDate: "2026-10-29T08:00:00Z",
      changeDate: "2026-10-29T09:00:00Z",
    }));
    const { idp, sent } = driverWith([
      [200, { sessions: full }],
      [
        200,
        {
          sessions: [
            {
              id: "s_last",
              creationDate: "2026-10-28T08:00:00Z",
              userAgent: { description: "Safari on iOS", ip: "203.0.113.9" },
            },
            { creationDate: "2026-10-28T08:00:00Z" },
          ],
        },
      ],
    ]);
    const sessions = await idp.listSessions("u_1");
    expect(sessions).toHaveLength(101);
    expect(sessions[0]).toEqual({
      sessionId: "s_0",
      createdAt: "2026-10-29T08:00:00Z",
      lastActiveAt: "2026-10-29T09:00:00Z",
    });
    expect(sessions[100]).toEqual({
      sessionId: "s_last",
      createdAt: "2026-10-28T08:00:00Z",
      lastActiveAt: "2026-10-28T08:00:00Z",
      userAgent: "Safari on iOS",
    });
    expect(sent.map((request) => [request.method, request.url])).toEqual([
      ["POST", "https://id.acme.example/v2/sessions/search"],
      ["POST", "https://id.acme.example/v2/sessions/search"],
    ]);
    expect(JSON.parse(sent[1]?.body ?? "")).toEqual({
      query: { offset: 100, limit: 100 },
      queries: [{ userIdQuery: { id: "u_1" } }],
    });
  });

  it("runs the device flow over the OAuth endpoints", async () => {
    const { idp, sent } = driverWith([
      [
        200,
        {
          device_code: "dc_1",
          user_code: "ABCD-EFGH",
          verification_uri: "https://id.acme.example/device",
          expires_in: 300,
        },
      ],
      [400, { error: "authorization_pending" }],
      [200, { access_token: "at_1", refresh_token: "rt_1", expires_in: 3600 }],
      [400, { error: "invalid_client" }],
    ]);
    expect(await idp.startDeviceAuthorization("till", ["openid", "offline_access"])).toEqual({
      deviceCode: "dc_1",
      userCode: "ABCD-EFGH",
      verificationUri: "https://id.acme.example/device",
      expiresIn: 300,
      interval: 5,
    });
    expect(sent[0]?.headers["content-type"]).toBe("application/x-www-form-urlencoded");
    expect(sent[0]?.body).toBe("client_id=till&scope=openid+offline_access");
    expect(await idp.pollDeviceToken("till", "dc_1")).toEqual({
      status: DeviceTokenStatus.Pending,
    });
    expect(await idp.pollDeviceToken("till", "dc_1")).toEqual({
      status: DeviceTokenStatus.Issued,
      accessToken: "at_1",
      refreshToken: "rt_1",
      expiresIn: 3600,
    });
    await expect(idp.pollDeviceToken("till", "dc_1")).rejects.toThrow("invalid_client");
  });

  it("adds the login policy while the organisation uses the default, and updates it after", async () => {
    const policy = {
      allowUsernamePassword: true,
      allowRegister: false,
      allowExternalIdp: true,
      forceMfa: true,
      allowPasswordless: false,
      hidePasswordReset: false,
      ignoreUnknownUsernames: true,
    };
    const added = driverWith([
      [200, { policy: { isDefault: true } }],
      [200, {}],
    ]);
    await added.idp.setLoginPolicy("org_1", policy);
    expect(added.sent[1]?.method).toBe("POST");
    expect(JSON.parse(added.sent[1]?.body ?? "")).toMatchObject({
      forceMfa: true,
      passwordlessType: "PASSWORDLESS_TYPE_NOT_ALLOWED",
    });
    const updated = driverWith([
      [200, { policy: { isDefault: false } }],
      [200, {}],
    ]);
    await updated.idp.setLoginPolicy("org_1", policy);
    expect(updated.sent.map((request) => request.method)).toEqual(["GET", "PUT"]);
    expect(updated.sent[1]?.headers["x-zitadel-orgid"]).toBe("org_1");
  });

  it("lists a user's authentication methods as unique amr codes", async () => {
    const { idp, sent } = driverWith([
      [
        200,
        {
          authMethodTypes: [
            "AUTHENTICATION_METHOD_TYPE_PASSWORD",
            "AUTHENTICATION_METHOD_TYPE_TOTP",
            "AUTHENTICATION_METHOD_TYPE_OTP_EMAIL",
            "AUTHENTICATION_METHOD_TYPE_U2F",
            "AUTHENTICATION_METHOD_TYPE_SOMETHING_NEW",
          ],
        },
      ],
      [200, {}],
    ]);
    expect(await idp.listAuthMethods("u 1")).toEqual(["pwd", "otp", "hwk"]);
    expect(sent[0]).toMatchObject({
      url: "https://id.acme.example/v2/users/u%201/authentication_methods",
      method: "GET",
    });
    expect(await idp.listAuthMethods("u_2")).toEqual([]);
  });

  it("brings the policy's providers and second factors to exactly the listed ones", async () => {
    const { idp, sent } = driverWith([
      [200, { policy: { isDefault: false } }],
      [200, {}],
      [200, { result: [{ idpId: "idp_old" }, { idpId: "idp_keep" }] }],
      [200, {}],
      [404, {}],
      [200, { result: ["SECOND_FACTOR_TYPE_OTP", "SECOND_FACTOR_TYPE_OTP_SMS"] }],
      [200, {}],
      [200, {}],
    ]);
    await idp.setLoginPolicy("org_1", {
      allowUsernamePassword: true,
      allowRegister: true,
      allowExternalIdp: true,
      forceMfa: false,
      allowPasswordless: true,
      hidePasswordReset: false,
      ignoreUnknownUsernames: true,
      externalProviderIds: ["idp_keep", "idp_new"],
      secondFactors: [IdpSecondFactor.Totp, IdpSecondFactor.U2f],
    });
    expect(
      sent.map(
        (request) => `${request.method} ${request.url.replace("https://id.acme.example", "")}`,
      ),
    ).toEqual([
      "GET /management/v1/policies/login",
      "PUT /management/v1/policies/login",
      "POST /management/v1/policies/login/idps/_search",
      "POST /management/v1/policies/login/idps",
      "DELETE /management/v1/policies/login/idps/idp_old",
      "POST /management/v1/policies/login/second_factors/_search",
      "POST /management/v1/policies/login/second_factors",
      "DELETE /management/v1/policies/login/second_factors/SECOND_FACTOR_TYPE_OTP_SMS",
    ]);
    expect(JSON.parse(sent[3]?.body ?? "")).toEqual({
      idpId: "idp_new",
      ownerType: "IDP_OWNER_TYPE_SYSTEM",
    });
    expect(JSON.parse(sent[6]?.body ?? "")).toEqual({ type: "SECOND_FACTOR_TYPE_U2F" });
    expect(sent.every((request) => request.headers["x-zitadel-orgid"] === "org_1")).toBe(true);
  });

  it("leaves providers and second factors alone when the policy does not list them", async () => {
    const { idp, sent } = driverWith([
      [200, { policy: { isDefault: true } }],
      [200, {}],
    ]);
    await idp.setLoginPolicy("org_1", {
      allowUsernamePassword: true,
      allowRegister: false,
      allowExternalIdp: false,
      forceMfa: true,
      allowPasswordless: false,
      hidePasswordReset: false,
      ignoreUnknownUsernames: true,
    });
    expect(sent).toHaveLength(2);
  });

  it("creates a user with and finds it by its stackra_user_id metadata", async () => {
    const { idp, sent } = driverWith([
      [201, { userId: "u_1" }],
      [200, { result: [{ userId: "u_1" }] }],
      [200, { result: [] }],
    ]);
    await idp.createUser({
      organizationId: "org_1",
      username: "rana",
      givenName: "Rana",
      familyName: "Haddad",
      email: "rana@acme.example",
      stackraUserId: "usr_1",
    });
    expect(JSON.parse(sent[0]?.body ?? "").metadata).toEqual([
      { key: "stackra_user_id", value: btoa("usr_1") },
    ]);
    expect(await idp.findUserId("usr_1")).toBe("u_1");
    expect(sent[1]?.url).toBe("https://id.acme.example/v2/users");
    expect(JSON.parse(sent[1]?.body ?? "").queries[0].andQuery.queries).toEqual([
      { metadataKeyFilter: { key: "stackra_user_id", method: "TEXT_FILTER_METHOD_EQUALS" } },
      { metadataValueFilter: { value: btoa("usr_1"), method: "BYTE_FILTER_METHOD_EQUALS" } },
    ]);
    expect(await idp.findUserId("usr_2")).toBeUndefined();
  });

  it("signs in with a passkey through a v2 session and its webAuthN check", async () => {
    const publicKey = { challenge: "ch", rpId: "id.acme.example", userVerification: "required" };
    const credential = {
      id: "c",
      rawId: "c",
      type: "public-key",
      response: { signature: "s" },
    } as const;
    const { idp, sent } = driverWith([
      [
        201,
        {
          sessionId: "s_1",
          sessionToken: "t_0",
          challenges: { webAuthN: { publicKeyCredentialRequestOptions: { publicKey } } },
        },
      ],
      [200, { sessionToken: "t_1" }],
      [400, { message: "invalid assertion" }],
    ]);
    expect(await idp.startPasskeySignIn("rana@acme.example")).toEqual({
      sessionId: "s_1",
      options: publicKey,
    });
    expect(JSON.parse(sent[0]?.body ?? "")).toEqual({
      checks: { user: { loginName: "rana@acme.example" } },
      challenges: {
        webAuthN: {
          domain: "id.acme.example",
          userVerificationRequirement: "USER_VERIFICATION_REQUIREMENT_REQUIRED",
        },
      },
    });
    expect(await idp.finishPasskeySignIn("s_1", credential)).toEqual({
      sessionId: "s_1",
      sessionToken: "t_1",
    });
    expect([sent[1]?.method, sent[1]?.url]).toEqual([
      "PATCH",
      "https://id.acme.example/v2/sessions/s_1",
    ]);
    expect(JSON.parse(sent[1]?.body ?? "")).toEqual({
      checks: { webAuthN: { credentialAssertionData: credential } },
    });
    await expect(idp.finishPasskeySignIn("s_1", credential)).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });

  it("refuses a passkey sign-in for an unknown login", async () => {
    const { idp } = driverWith([[404, { message: "not found" }]]);
    await expect(idp.startPasskeySignIn("nobody")).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("treats a 403 on a passkey call as a bug, not a refusal", async () => {
    const credential = { id: "c", rawId: "c", type: "public-key", response: {} } as const;
    const calls = [
      (idp: ZitadelIdpAdminDriver) => idp.startPasskeySignIn("rana@acme.example"),
      (idp: ZitadelIdpAdminDriver) => idp.finishPasskeySignIn("s_1", credential),
      (idp: ZitadelIdpAdminDriver) => idp.startPasskeyRegistration("u_1"),
      (idp: ZitadelIdpAdminDriver) => idp.finishPasskeyRegistration("u_1", "pk_1", credential, "a"),
    ];
    for (const run of calls) {
      const failure = await run(driverWith([[403, { message: "missing permission" }]]).idp).then(
        () => undefined,
        (error: unknown) => error,
      );
      expect(failure).toBeInstanceOf(Error);
      expect(failure).not.toBeInstanceOf(UnauthenticatedError);
      expect((failure as Error).message).toMatch(/^ZITADEL answered 403 to /);
    }
  });

  it("refuses a passkey registration for an unknown user", async () => {
    const { idp } = driverWith([[404, { message: "not found" }]]);
    await expect(idp.startPasskeyRegistration("u_9")).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("registers a passkey through the v2 user passkey endpoints", async () => {
    const publicKey = { challenge: "ch", rp: { id: "id.acme.example", name: "Acme" } };
    const credential = { id: "c", rawId: "c", type: "public-key", response: {} } as const;
    const { idp, sent } = driverWith([
      [201, { passkeyId: "pk_1", publicKeyCredentialCreationOptions: { publicKey } }],
      [200, {}],
    ]);
    expect(await idp.startPasskeyRegistration("u_1")).toEqual({
      passkeyId: "pk_1",
      options: publicKey,
    });
    expect(JSON.parse(sent[0]?.body ?? "")).toEqual({
      domain: "id.acme.example",
      authenticator: "PASSKEY_AUTHENTICATOR_PLATFORM",
    });
    await idp.finishPasskeyRegistration("u_1", "pk_1", credential, "iPhone");
    expect(sent[1]?.url).toBe("https://id.acme.example/v2/users/u_1/passkeys/pk_1");
    expect(JSON.parse(sent[1]?.body ?? "")).toEqual({
      publicKeyCredential: credential,
      passkeyName: "iPhone",
    });
  });
});
