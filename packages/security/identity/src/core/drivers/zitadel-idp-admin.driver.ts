/**
 * Stackra file contract:
 * Purpose: `ZitadelIdpAdminDriver`, the ZITADEL driver of `IdpAdmin`: human users through the v2 user service, machine
 *          users and their client secret through the management API, sessions (listed and ended) through the v2 session service, the
 *          device flow through the OAuth endpoints (RFC 8628), and an organisation's login policy through the
 *          management API (added the first time with the default's factors and providers, updated after only when a
 *          rule changes, the settings Stackra does not manage carried over, its external providers and second factors
 *          brought to exactly the listed ones in a sign-in-safe order: additions, then the tightening rules, then
 *          removals; read back with the providers and factors it offers); the claims action as an Actions v2 target and its `preuserinfo` and
 *          `preaccesstoken` executions; a user's enrolled authentication methods through the
 *          v2 user service, mapped to RFC 8176 `amr` codes; a Stackra user's provider user through the v2 user search on
 *          the `stackra_user_id` metadata `createUser` writes, and an email's Stackra user through the v2 user search on
 *          the email and that user's metadata; and passkeys: sign-in as a v2 session with a `webAuthN`
 *          challenge checked by a session update, registration through the v2 user passkey endpoints.
 * Boundary: one HTTPS call per step, with the service account token of `IdpAdminConfig` as a bearer token and the
 *           configured timeout, through the global fetch. Managed or bring-your-own is the configured URL: the
 *           platform's ZITADEL or a tenant's own. A 409 is `IdpUserExistsError`; a timeout, a network failure, a 429 or a 5xx is `IdpAdminUnavailableError`
 *           (retryable); any other 4xx is a bug and throws an `Error` naming the method, path and status, never a body.
 *           Ending a session that is already gone (404) succeeds. A refused passkey check (400, 404, 412) or an
 *           unknown user (404) is `UnauthenticatedError`, while an unknown passkey login answers a decoy (STA-2102); a 403 (a missing permission) stays a bug. The passkey relying party is the configured URL's host, so the app lists that host
 *           in its associated domains. Personal data and secrets are never logged.
 * Runtime: isomorphic
 * Governing contract: ADR 0206; ADR 0207; ADR 0235 (decision 1); RFC 8628; ADR 0376; ADR 0410 (STA-834); RFC 8176; STA-1264; STA-1263;
 *                     STA-1538 (passkeys); STA-1543 (erasure); STA-1580 (session list); STA-1586 (operator bootstrap); STA-2817 (reading the login policy; the sign-in-safe write order).
 */
import { Driver } from "@stackra/container";
import { Enum } from "@stackra/contracts";
import { UnauthenticatedError } from "@stackra/errors";

import type { IdpAdminConfig } from "#config/idp-admin.config";
import { DeviceTokenStatus, IdpAdmin, IdpSecondFactor } from "#contracts/index";
import type {
  ClaimsActionInput,
  ClaimsActionInstall,
  DeviceAuthorization,
  DeviceTokenResult,
  IdpMachineCredential,
  IdpMachineUserInput,
  IdpSession,
  IdpSessionGrant,
  IdpUserInput,
  LoginPolicy,
  PasskeyCredential,
  PasskeyRegistrationChallenge,
  PasskeyRequestOptions,
  PasskeySignInChallenge,
} from "#contracts/index";
import { IdpAdminUnavailableError } from "#core/errors/idp-admin-unavailable.error";
import { IdpUserExistsError } from "#core/errors/idp-user-exists.error";
import { randomToken } from "#core/functions/random-token.function";

/** The OAuth grant type of a device-flow poll. */
const DEVICE_GRANT = "urn:ietf:params:oauth:grant-type:device_code";

/** The user metadata key holding the Stackra `usr_` id; the claim action reads the same key. */
const STACKRA_USER_ID = "stackra_user_id";

/** The statuses ZITADEL answers an unknown login or user with; a 403 is a missing permission, so a bug. */
const UNKNOWN: readonly number[] = [404];

/** The statuses ZITADEL answers a refused passkey check with. */
const REFUSED: readonly number[] = [400, 404, 412];

/** The claims action's target name: an install finds its own target by it. */
const CLAIMS_TARGET = "stackra-claims";

/** The functions the claims action runs on: the userinfo answer and the access token. */
const CLAIMS_FUNCTIONS: readonly string[] = ["preuserinfo", "preaccesstoken"];

/** How many sessions one search reads. */
const PAGE = 100;

/** The device-flow errors RFC 8628 defines, by their status. */
const DEVICE_ERRORS: ReadonlySet<string> = new Set([
  DeviceTokenStatus.Pending,
  DeviceTokenStatus.SlowDown,
  DeviceTokenStatus.Denied,
  DeviceTokenStatus.Expired,
]);

/**
 * ZITADEL's authentication method types to RFC 8176 `amr` codes: a protocol mapping, not policy (which level each code
 * reaches is `IdentityConfig.assuranceByMethod`). A passkey is a software or platform key (`swk`), a U2F key hardware
 * (`hwk`), an external provider federated (`fed`). An unknown type is dropped.
 */
const AMR_OF_METHOD: Readonly<Record<string, string>> = {
  AUTHENTICATION_METHOD_TYPE_PASSWORD: "pwd",
  AUTHENTICATION_METHOD_TYPE_PASSKEY: "swk",
  AUTHENTICATION_METHOD_TYPE_IDP: "fed",
  AUTHENTICATION_METHOD_TYPE_TOTP: "otp",
  AUTHENTICATION_METHOD_TYPE_U2F: "hwk",
  AUTHENTICATION_METHOD_TYPE_OTP_SMS: "sms",
  AUTHENTICATION_METHOD_TYPE_OTP_EMAIL: "otp",
};

/** The provider-neutral second factors to ZITADEL's second factor types. */
const SECOND_FACTOR_TYPE: Readonly<Record<IdpSecondFactor, string>> = {
  [IdpSecondFactor.Totp]: "SECOND_FACTOR_TYPE_OTP",
  [IdpSecondFactor.U2f]: "SECOND_FACTOR_TYPE_U2F",
  [IdpSecondFactor.OtpEmail]: "SECOND_FACTOR_TYPE_OTP_EMAIL",
  [IdpSecondFactor.OtpSms]: "SECOND_FACTOR_TYPE_OTP_SMS",
};

/** ZITADEL's passwordless (passkey) switch, on and off. */
const PASSWORDLESS_ALLOWED = "PASSWORDLESS_TYPE_ALLOWED";
const PASSWORDLESS_NOT_ALLOWED = "PASSWORDLESS_TYPE_NOT_ALLOWED";

/** The management API path of an organisation's login policy. */
const LOGIN_POLICY = "/management/v1/policies/login";

/** The owner type of a login-policy provider: the regional providers (national IDs) are configured on the instance. */
const SYSTEM_OWNED = "IDP_OWNER_TYPE_SYSTEM";

/**
 * The sign-in rules Stackra manages, as ZITADEL's login policy spells them. A type alias, not an interface, so it reads
 * as the JSON record `sameRules` compares field by field.
 */
type LoginRules = {
  readonly allowUsernamePassword: boolean;
  readonly allowRegister: boolean;
  readonly allowExternalIdp: boolean;
  readonly forceMfa: boolean;
  readonly passwordlessType: string;
  readonly hidePasswordReset: boolean;
  readonly ignoreUnknownUsernames: boolean;
};

/**
 * The login policy settings Stackra does not manage, carried over from the policy in force on every add or update, so
 * setting the sign-in rules never resets the check lifetimes, the redirect or the login-name switches to zero.
 */
const KEPT_LOGIN_POLICY_FIELDS: readonly string[] = [
  "defaultRedirectUri",
  "passwordCheckLifetime",
  "externalLoginCheckLifetime",
  "mfaInitSkipLifetime",
  "secondFactorCheckLifetime",
  "multiFactorCheckLifetime",
  "allowDomainDiscovery",
  "disableLoginWithEmail",
  "disableLoginWithPhone",
  "forceMfaLocalOnly",
];

/** The strings of `value` when it is a list, else none. */
function listOf(value: unknown): string[] {
  return (Array.isArray(value) ? value : []).filter(
    (item): item is string => typeof item === "string",
  );
}

/**
 * Whether the policy in force already has `rules`. ZITADEL leaves a false flag and the zero passwordless type out of
 * its answer, so a missing flag reads as off.
 */
function sameRules(
  answered: Readonly<Record<string, unknown>> | undefined,
  rules: Readonly<Record<string, unknown>>,
): boolean {
  return Object.entries(rules).every(([field, wanted]) => {
    const value = answered?.[field];
    if (field === "passwordlessType") return (value ?? PASSWORDLESS_NOT_ALLOWED) === wanted;
    return (value === true) === wanted;
  });
}

/** `policy`'s rules as ZITADEL's login policy spells them. */
function rulesOf(policy: LoginPolicy): LoginRules {
  return {
    allowUsernamePassword: policy.allowUsernamePassword,
    allowRegister: policy.allowRegister,
    allowExternalIdp: policy.allowExternalIdp,
    forceMfa: policy.forceMfa,
    passwordlessType: policy.allowPasswordless ? PASSWORDLESS_ALLOWED : PASSWORDLESS_NOT_ALLOWED,
    hidePasswordReset: policy.hidePasswordReset,
    ignoreUnknownUsernames: policy.ignoreUnknownUsernames,
  };
}

/**
 * The rules to write before any provider or second factor is added: `target`, except that nothing tightens yet. A
 * sign-in method on now (or wanted) stays on, and a second factor is forced only if it is forced now (when the factors
 * offered now still stand). The tightening waits until every addition succeeded, so a write that fails between the
 * two never leaves a tenant forced to a factor it is not offered or without a way to sign in.
 */
function widenedRules(
  answered: Readonly<Record<string, unknown>> | undefined,
  target: LoginRules,
): LoginRules {
  const on = (field: string) => answered?.[field] === true;
  const passwordless =
    target.passwordlessType === PASSWORDLESS_ALLOWED ||
    answered?.["passwordlessType"] === PASSWORDLESS_ALLOWED;
  return {
    ...target,
    allowUsernamePassword: target.allowUsernamePassword || on("allowUsernamePassword"),
    allowExternalIdp: target.allowExternalIdp || on("allowExternalIdp"),
    passwordlessType: passwordless ? PASSWORDLESS_ALLOWED : PASSWORDLESS_NOT_ALLOWED,
    forceMfa: target.forceMfa && on("forceMfa"),
  };
}

/** One request: the method, the path, a JSON or form body, and the organisation it acts in. */
interface Call {
  readonly method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  readonly path: string;
  readonly json?: object;
  readonly form?: Readonly<Record<string, string>>;
  readonly organizationId?: string;
}

/** The fields of a v2 session search result the driver reads; the rest (factors, IP, headers) stay unread. */
interface ZitadelSession {
  readonly id?: unknown;
  readonly creationDate?: unknown;
  readonly changeDate?: unknown;
  readonly userAgent?: { readonly description?: unknown };
}

/**
 * The ZITADEL driver of `IdpAdmin`: users, machine users, sessions, the device flow and login policies.
 *
 * @example
 * // runway: config.idp_admin.url = https://id.stackra.app; secret IDENTITY_IDP_ADMIN_TOKEN
 * const userId = await idp.createUser({ organizationId, username, givenName, familyName, email });
 */
export class ZitadelIdpAdminDriver extends Driver(IdpAdmin) {
  /** The base URL, without a trailing slash. */
  private readonly base: string;

  /** The service account token. */
  private readonly token: string;

  /** Milliseconds one call may take. */
  private readonly timeoutMs: number;

  /** The passkey relying party: the provider's host. */
  private readonly domain: string;

  /**
   * @param config - the provider's URL, token and timeout.
   * @throws TypeError when the URL or the token is not set.
   */
  constructor(config: IdpAdminConfig) {
    super();
    if (config.url === "" || config.token === "")
      throw new TypeError(
        "IdpAdminConfig needs url and the IDENTITY_IDP_ADMIN_TOKEN secret for ZitadelIdpAdminDriver",
      );
    this.base = config.url.replace(/\/+$/, "");
    this.token = config.token;
    this.timeoutMs = config.timeoutSeconds * 1000;
    this.domain = new URL(this.base).hostname;
  }

  /** Implements `IdpAdmin.createUser`, documented there. */
  async createUser(input: IdpUserInput): Promise<string> {
    const { body } = await this.call({
      method: "POST",
      path: "/v2/users/human",
      json: {
        username: input.username,
        organization: { orgId: input.organizationId },
        profile: { givenName: input.givenName, familyName: input.familyName },
        email: { email: input.email, isVerified: input.emailVerified === true },
        ...(input.stackraUserId === undefined
          ? {}
          : { metadata: [{ key: STACKRA_USER_ID, value: btoa(input.stackraUserId) }] }),
      },
    });
    return stringOf(body, "userId");
  }

  /** Implements `IdpAdmin.createMachineUser`, documented there. */
  async createMachineUser(input: IdpMachineUserInput): Promise<IdpMachineCredential> {
    const organizationId = input.organizationId;
    const created = await this.call({
      method: "POST",
      path: "/management/v1/users/machine",
      organizationId,
      json: {
        userName: input.username,
        name: input.name,
        description: input.description ?? "",
        accessTokenType: "ACCESS_TOKEN_TYPE_JWT",
      },
    });
    const userId = stringOf(created.body, "userId");
    const secret = await this.call({
      method: "PUT",
      path: `/management/v1/users/${encodeURIComponent(userId)}/secret`,
      organizationId,
      json: {},
    });
    return {
      userId,
      clientId: stringOf(secret.body, "clientId"),
      clientSecret: stringOf(secret.body, "clientSecret"),
    };
  }

  /** Implements `IdpAdmin.deactivateUser`, documented there. */
  async deactivateUser(userId: string): Promise<void> {
    await this.call({
      method: "POST",
      path: `/v2/users/${encodeURIComponent(userId)}/deactivate`,
      json: {},
    });
  }

  /** Implements `IdpAdmin.removeUser`, documented there. */
  async removeUser(userId: string): Promise<void> {
    await this.call({ method: "DELETE", path: `/v2/users/${encodeURIComponent(userId)}` });
  }

  /** See `IdpAdmin.listSessions`: the v2 session search on the user id, a page at a time. */
  async listSessions(userId: string): Promise<readonly IdpSession[]> {
    const listed: IdpSession[] = [];
    for (let offset = 0; ; offset += PAGE) {
      const { body } = await this.call({
        method: "POST",
        path: "/v2/sessions/search",
        json: { query: { offset, limit: PAGE }, queries: [{ userIdQuery: { id: userId } }] },
      });
      const sessions = (body as { sessions?: readonly ZitadelSession[] }).sessions ?? [];
      for (const session of sessions) {
        if (typeof session.id !== "string" || session.id === "") continue;
        const createdAt = typeof session.creationDate === "string" ? session.creationDate : "";
        const description = session.userAgent?.description;
        listed.push({
          sessionId: session.id,
          createdAt,
          lastActiveAt: typeof session.changeDate === "string" ? session.changeDate : createdAt,
          ...(typeof description === "string" && description !== ""
            ? { userAgent: description }
            : {}),
        });
      }
      if (sessions.length < PAGE) return listed;
    }
  }

  /** Implements `IdpAdmin.endSession`, documented there. */
  async endSession(sessionId: string): Promise<void> {
    await this.call(
      { method: "DELETE", path: `/v2/sessions/${encodeURIComponent(sessionId)}`, json: {} },
      [404],
    );
  }

  /** See `IdpAdmin.endSessions`: searches the user's sessions a page at a time and ends each. */
  async endSessions(userId: string): Promise<number> {
    const ended = new Set<string>();
    for (;;) {
      const { body } = await this.call({
        method: "POST",
        path: "/v2/sessions/search",
        json: { query: { offset: 0, limit: PAGE }, queries: [{ userIdQuery: { id: userId } }] },
      });
      const sessions = (body as { sessions?: readonly { id?: unknown }[] }).sessions ?? [];
      const ids = sessions
        .map((session) => session.id)
        .filter((id): id is string => typeof id === "string" && !ended.has(id));
      for (const id of ids) {
        await this.endSession(id);
        ended.add(id);
      }
      // A page shorter than the limit, or one listing only ended sessions, is the last.
      if (ids.length === 0 || sessions.length < PAGE) return ended.size;
    }
  }

  /** Implements `IdpAdmin.startDeviceAuthorization`, documented there. */
  async startDeviceAuthorization(
    clientId: string,
    scopes: readonly string[],
  ): Promise<DeviceAuthorization> {
    const { body } = await this.call({
      method: "POST",
      path: "/oauth/v2/device_authorization",
      form: { client_id: clientId, scope: scopes.join(" ") },
    });
    const complete = (body as { verification_uri_complete?: unknown }).verification_uri_complete;
    return {
      deviceCode: stringOf(body, "device_code"),
      userCode: stringOf(body, "user_code"),
      verificationUri: stringOf(body, "verification_uri"),
      ...(typeof complete === "string" ? { verificationUriComplete: complete } : {}),
      expiresIn: numberOf(body, "expires_in"),
      // RFC 8628 section 3.2: five seconds when the provider names no interval.
      interval:
        (body as { interval?: unknown }).interval === undefined ? 5 : numberOf(body, "interval"),
    };
  }

  /** Implements `IdpAdmin.pollDeviceToken`, documented there. */
  async pollDeviceToken(clientId: string, deviceCode: string): Promise<DeviceTokenResult> {
    const { status, body } = await this.call(
      {
        method: "POST",
        path: "/oauth/v2/token",
        form: { grant_type: DEVICE_GRANT, device_code: deviceCode, client_id: clientId },
      },
      [400],
    );
    if (status === 400) {
      const error = (body as { error?: unknown }).error;
      if (typeof error === "string" && DEVICE_ERRORS.has(error))
        return { status: error as DeviceTokenStatus };
      throw new Error(`ZITADEL refused the device-flow poll (${String(error)})`);
    }
    const refresh = (body as { refresh_token?: unknown }).refresh_token;
    return {
      status: DeviceTokenStatus.Issued,
      accessToken: stringOf(body, "access_token"),
      ...(typeof refresh === "string" ? { refreshToken: refresh } : {}),
      expiresIn: numberOf(body, "expires_in"),
    };
  }

  /** Implements `IdpAdmin.listAuthMethods`, documented there. */
  async listAuthMethods(userId: string): Promise<readonly string[]> {
    const { body } = await this.call({
      method: "GET",
      path: `/v2/users/${encodeURIComponent(userId)}/authentication_methods`,
    });
    const types = (body as { authMethodTypes?: unknown }).authMethodTypes;
    const codes = (Array.isArray(types) ? types : [])
      .map((type) => (typeof type === "string" ? AMR_OF_METHOD[type] : undefined))
      .filter((code): code is string => code !== undefined);
    return [...new Set(codes)];
  }

  /** See `IdpAdmin.findUserId`: one v2 user search on the `stackra_user_id` metadata. */
  async findUserId(stackraUserId: string): Promise<string | undefined> {
    const { body } = await this.call({
      method: "POST",
      path: "/v2/users",
      json: {
        query: { offset: 0, limit: 1 },
        queries: [
          {
            andQuery: {
              queries: [
                {
                  metadataKeyFilter: { key: STACKRA_USER_ID, method: "TEXT_FILTER_METHOD_EQUALS" },
                },
                {
                  metadataValueFilter: {
                    value: btoa(stackraUserId),
                    method: "BYTE_FILTER_METHOD_EQUALS",
                  },
                },
              ],
            },
          },
        ],
      },
    });
    const id = (body as { result?: readonly { userId?: unknown }[] }).result?.[0]?.userId;
    return typeof id === "string" && id !== "" ? id : undefined;
  }

  /** See `IdpAdmin.findStackraUserId`: a v2 user search on the email, then the user's `stackra_user_id` metadata. */
  async findStackraUserId(email: string): Promise<string | undefined> {
    const { body } = await this.call({
      method: "POST",
      path: "/v2/users",
      json: {
        query: { offset: 0, limit: 2 },
        queries: [
          {
            emailQuery: { emailAddress: email, method: "TEXT_QUERY_METHOD_EQUALS_IGNORE_CASE" },
          },
        ],
      },
    });
    const found = (body as { result?: readonly { userId?: unknown }[] }).result ?? [];
    if (found.length > 1) throw new Error("ZITADEL holds more than one user with this email");
    const userId = found[0]?.userId;
    if (typeof userId !== "string" || userId === "") return undefined;
    const { status, body: held } = await this.call(
      {
        method: "GET",
        path: `/management/v1/users/${encodeURIComponent(userId)}/metadata/${STACKRA_USER_ID}`,
      },
      UNKNOWN,
    );
    const value = (held as { metadata?: { value?: unknown } }).metadata?.value;
    return status === 404 || typeof value !== "string" ? undefined : atob(value);
  }

  /**
   * See `IdpAdmin.startPasskeySignIn`: a v2 session with the user check and a `webAuthN` challenge. ZITADEL's 404 for
   * an unknown login answers a decoy after the same round trip: a random numeric session id ZITADEL never issued (so
   * `finishPasskeySignIn` gets its 404 and refuses) and options with the same keys as a live answer's.
   */
  async startPasskeySignIn(loginName: string): Promise<PasskeySignInChallenge> {
    const { status, body } = await this.call(
      {
        method: "POST",
        path: "/v2/sessions",
        json: {
          checks: { user: { loginName } },
          challenges: {
            webAuthN: {
              domain: this.domain,
              userVerificationRequirement: "USER_VERIFICATION_REQUIREMENT_REQUIRED",
            },
          },
        },
      },
      UNKNOWN,
    );
    if (UNKNOWN.includes(status))
      return {
        sessionId: String(crypto.getRandomValues(new BigUint64Array(1))[0] ?? 0n)
          .padStart(20, "0")
          .slice(-18),
        options: { challenge: randomToken(), rpId: this.domain, userVerification: "required" },
      };
    const options = objectOf<Partial<PasskeyRequestOptions>>(
      (
        body as {
          challenges?: {
            webAuthN?: { publicKeyCredentialRequestOptions?: { publicKey?: unknown } };
          };
        }
      ).challenges?.webAuthN?.publicKeyCredentialRequestOptions?.publicKey,
    );
    // A live answer keeps only the decoy's keys: `allowCredentials` would name the login's passkeys (and so show it
    // exists), and a passkey is a discoverable credential, so the device offers it without the list.
    return {
      sessionId: stringOf(body, "sessionId"),
      options: {
        challenge: stringOf(options, "challenge"),
        rpId: stringOf(options, "rpId"),
        userVerification: "required",
      },
    };
  }

  /** See `IdpAdmin.finishPasskeySignIn`: the session's `webAuthN` check. */
  async finishPasskeySignIn(
    sessionId: string,
    credential: PasskeyCredential,
  ): Promise<IdpSessionGrant> {
    const { status, body } = await this.call(
      {
        method: "PATCH",
        path: `/v2/sessions/${encodeURIComponent(sessionId)}`,
        json: { checks: { webAuthN: { credentialAssertionData: credential } } },
      },
      REFUSED,
    );
    refuseOn(status, REFUSED);
    return { sessionId, sessionToken: stringOf(body, "sessionToken") };
  }

  /** See `IdpAdmin.startPasskeyRegistration`: a platform passkey on the provider's host. */
  async startPasskeyRegistration(userId: string): Promise<PasskeyRegistrationChallenge> {
    const { status, body } = await this.call(
      {
        method: "POST",
        path: `/v2/users/${encodeURIComponent(userId)}/passkeys`,
        json: { domain: this.domain, authenticator: "PASSKEY_AUTHENTICATOR_PLATFORM" },
      },
      UNKNOWN,
    );
    refuseOn(status, UNKNOWN);
    const options = (body as { publicKeyCredentialCreationOptions?: { publicKey?: unknown } })
      .publicKeyCredentialCreationOptions?.publicKey;
    return { passkeyId: stringOf(body, "passkeyId"), options: objectOf(options) };
  }

  /** See `IdpAdmin.finishPasskeyRegistration`: the v2 passkey verification. */
  async finishPasskeyRegistration(
    userId: string,
    passkeyId: string,
    credential: PasskeyCredential,
    name: string,
  ): Promise<void> {
    const { status } = await this.call(
      {
        method: "POST",
        path: `/v2/users/${encodeURIComponent(userId)}/passkeys/${encodeURIComponent(passkeyId)}`,
        json: { publicKeyCredential: credential, passkeyName: name },
      },
      REFUSED,
    );
    refuseOn(status, REFUSED);
  }

  /**
   * See `IdpAdmin.installClaimsAction`: the Actions v2 target named `stackra-claims` (a `restCall` that fails the
   * token when the endpoint fails), created with its signing key the first time and pointed at the endpoint after,
   * then the `preuserinfo` and `preaccesstoken` function executions set to it.
   */
  async installClaimsAction(input: ClaimsActionInput): Promise<ClaimsActionInstall> {
    const target = {
      name: CLAIMS_TARGET,
      endpoint: input.endpoint,
      timeout: `${input.timeoutSeconds ?? 10}s`,
      restCall: { interruptOnError: true },
    };
    const { body: found } = await this.call({
      method: "POST",
      path: "/v2/actions/targets/search",
      json: {
        filters: [
          { targetNameFilter: { targetName: CLAIMS_TARGET, method: "TEXT_FILTER_METHOD_EQUALS" } },
        ],
      },
    });
    const existing = (found as { result?: readonly { id?: unknown }[] }).result?.[0]?.id;
    let installed: ClaimsActionInstall;
    if (typeof existing === "string" && existing !== "") {
      await this.call({
        method: "POST",
        path: `/v2/actions/targets/${encodeURIComponent(existing)}`,
        json: target,
      });
      installed = { targetId: existing };
    } else {
      const { body } = await this.call({
        method: "POST",
        path: "/v2/actions/targets",
        json: target,
      });
      const { id, signingKey } = body as { id?: unknown; signingKey?: unknown };
      if (typeof id !== "string" || typeof signingKey !== "string")
        throw new Error("ZITADEL created the claims target without an id or signing key");
      installed = { targetId: id, signingKey };
    }
    for (const name of CLAIMS_FUNCTIONS)
      await this.call({
        method: "PUT",
        path: "/v2/actions/executions",
        json: { condition: { function: { name } }, targets: [installed.targetId] },
      });
    return installed;
  }

  /**
   * See `IdpAdmin.setLoginPolicy`: adds the organisation's own policy while it uses the default, updates it after (and
   * sends no update when the rules already match, which ZITADEL would refuse as not changed). The settings Stackra does
   * not manage (`KEPT_LOGIN_POLICY_FIELDS`) are carried over from the policy in force; the first add also keeps the
   * default's multi factors, and the default's second factors and providers for a list the call leaves out.
   *
   * The writes are separate calls, so they run in an order where each one leaves the organisation able to sign in:
   * the rules first without tightening (`widenedRules`), then the missing second factors and providers, then the rules
   * as asked (a forced second factor, a method turned off), and the factors and providers no longer listed last. A
   * call that fails part way (`IdpAdminUnavailableError` is retryable) leaves a looser policy, never a lock-out.
   */
  async setLoginPolicy(organizationId: string, policy: LoginPolicy): Promise<void> {
    const current = await this.call({ method: "GET", path: LOGIN_POLICY, organizationId });
    const answered = (current.body as { policy?: Record<string, unknown> }).policy;
    // ZITADEL leaves a false flag out of its answer, so an organisation's own policy comes back with no `isDefault`:
    // only an explicit `true` (or no policy at all) means it still inherits the default and needs adding.
    const inherits = answered === undefined || answered["isDefault"] === true;
    const target = rulesOf(policy);
    const kept = Object.fromEntries(
      KEPT_LOGIN_POLICY_FIELDS.filter((field) => answered?.[field] !== undefined).map((field) => [
        field,
        answered?.[field],
      ]),
    );
    const wantedTypes =
      policy.secondFactors === undefined
        ? undefined
        : [...new Set(policy.secondFactors.map((factor) => SECOND_FACTOR_TYPE[factor]))];
    if (inherits) {
      const inherited = await this.providersOf(organizationId);
      const wantedProviders = policy.externalProviderIds ?? inherited;
      const first = widenedRules(answered, target);
      // One add carries the factors and providers with the loosened rules, so the new policy never starts empty.
      await this.call({
        method: "POST",
        path: LOGIN_POLICY,
        organizationId,
        json: {
          ...kept,
          secondFactors: wantedTypes ?? listOf(answered?.["secondFactors"]),
          multiFactors: listOf(answered?.["multiFactors"]),
          idps: wantedProviders.map((idpId) => ({ idpId, ownerType: SYSTEM_OWNED })),
          ...first,
        },
      });
      // A provider the add did not link is linked before the rules tighten.
      const linked = await this.providersOf(organizationId);
      await this.addProviders(
        organizationId,
        wantedProviders.filter((id) => !linked.includes(id)),
      );
      if (!sameRules(first, target)) await this.putRules(organizationId, kept, target);
      await this.removeProviders(
        organizationId,
        linked.filter((id) => !wantedProviders.includes(id)),
      );
      return;
    }
    const wantedProviders = policy.externalProviderIds;
    const providers = wantedProviders === undefined ? [] : await this.providersOf(organizationId);
    const types = wantedTypes === undefined ? [] : await this.secondFactorTypesOf(organizationId);
    const addedProviders = (wantedProviders ?? []).filter((id) => !providers.includes(id));
    const addedTypes = (wantedTypes ?? []).filter((type) => !types.includes(type));
    // With nothing to add, the factors and providers in force cover the ones asked for, so the rules go first as asked.
    const first =
      addedProviders.length + addedTypes.length === 0 ? target : widenedRules(answered, target);
    if (!sameRules(answered, first)) await this.putRules(organizationId, kept, first);
    await this.addSecondFactors(organizationId, addedTypes);
    await this.addProviders(organizationId, addedProviders);
    if (!sameRules(first, target)) await this.putRules(organizationId, kept, target);
    if (wantedTypes !== undefined)
      await this.removeSecondFactors(
        organizationId,
        types.filter((type) => !wantedTypes.includes(type)),
      );
    if (wantedProviders !== undefined)
      await this.removeProviders(
        organizationId,
        providers.filter((id) => !wantedProviders.includes(id)),
      );
  }

  /**
   * See `IdpAdmin.getLoginPolicy`: the policy the organisation applies (its own or the inherited default; ZITADEL leaves
   * a false flag out of the answer), then the providers and second factors it offers. A factor type this package does
   * not name is left out.
   */
  async getLoginPolicy(organizationId: string): Promise<LoginPolicy> {
    const { body } = await this.call({
      method: "GET",
      path: "/management/v1/policies/login",
      organizationId,
    });
    const policy = (body as { policy?: Record<string, unknown> }).policy ?? {};
    const types = await this.secondFactorTypesOf(organizationId);
    return {
      allowUsernamePassword: policy["allowUsernamePassword"] === true,
      allowRegister: policy["allowRegister"] === true,
      allowExternalIdp: policy["allowExternalIdp"] === true,
      forceMfa: policy["forceMfa"] === true,
      allowPasswordless: policy["passwordlessType"] === PASSWORDLESS_ALLOWED,
      hidePasswordReset: policy["hidePasswordReset"] === true,
      ignoreUnknownUsernames: policy["ignoreUnknownUsernames"] === true,
      externalProviderIds: await this.providersOf(organizationId),
      secondFactors: Enum.values(IdpSecondFactor).filter((factor) =>
        types.includes(SECOND_FACTOR_TYPE[factor]),
      ),
    };
  }

  /** The provider ids the organisation's login policy offers now. */
  private async providersOf(organizationId: string): Promise<string[]> {
    // shortcut: one page of PAGE linked providers; page through when an organisation can link more.
    const { body } = await this.call({
      method: "POST",
      path: "/management/v1/policies/login/idps/_search",
      organizationId,
      json: { query: { offset: 0, limit: PAGE } },
    });
    const rows = (body as { result?: readonly { idpId?: unknown }[] }).result ?? [];
    return rows.map((row) => row.idpId).filter((id): id is string => typeof id === "string");
  }

  /** The `SECOND_FACTOR_TYPE_*` values the organisation's login policy offers now. */
  private async secondFactorTypesOf(organizationId: string): Promise<string[]> {
    const { body } = await this.call({
      method: "POST",
      path: "/management/v1/policies/login/second_factors/_search",
      organizationId,
      json: {},
    });
    const result = (body as { result?: unknown }).result;
    return (Array.isArray(result) ? result : []).filter(
      (type): type is string => typeof type === "string",
    );
  }

  /** Updates the organisation's own policy to `rules`, with the settings Stackra does not manage carried over. */
  private async putRules(
    organizationId: string,
    kept: Readonly<Record<string, unknown>>,
    rules: LoginRules,
  ): Promise<void> {
    await this.call({
      method: "PUT",
      path: LOGIN_POLICY,
      organizationId,
      json: { ...kept, ...rules },
    });
  }

  /** Links `idpIds` to the organisation's login policy. */
  private async addProviders(organizationId: string, idpIds: readonly string[]): Promise<void> {
    for (const idpId of idpIds)
      await this.call({
        method: "POST",
        path: `${LOGIN_POLICY}/idps`,
        organizationId,
        json: { idpId, ownerType: SYSTEM_OWNED },
      });
  }

  /** Unlinks `idpIds` from the organisation's login policy; one already gone is fine. */
  private async removeProviders(organizationId: string, idpIds: readonly string[]): Promise<void> {
    for (const idpId of idpIds)
      await this.call(
        {
          method: "DELETE",
          path: `${LOGIN_POLICY}/idps/${encodeURIComponent(idpId)}`,
          organizationId,
        },
        [404],
      );
  }

  /** Offers the `SECOND_FACTOR_TYPE_*` values `types` on the organisation's login policy. */
  private async addSecondFactors(organizationId: string, types: readonly string[]): Promise<void> {
    for (const type of types)
      await this.call({
        method: "POST",
        path: `${LOGIN_POLICY}/second_factors`,
        organizationId,
        json: { type },
      });
  }

  /** Stops offering the `SECOND_FACTOR_TYPE_*` values `types`; one already gone is fine. */
  private async removeSecondFactors(
    organizationId: string,
    types: readonly string[],
  ): Promise<void> {
    for (const type of types)
      await this.call(
        {
          method: "DELETE",
          path: `${LOGIN_POLICY}/second_factors/${encodeURIComponent(type)}`,
          organizationId,
        },
        [404],
      );
  }

  /**
   * Sends `call` and resolves to its status and JSON body; `allowed` lists the non-2xx statuses the caller handles.
   *
   * @throws IdpUserExistsError on 409.
   * @throws IdpAdminUnavailableError on a network failure, a timeout, 429 or 5xx.
   * @throws Error on any other non-2xx status.
   */
  private async call(
    call: Call,
    allowed: readonly number[] = [],
  ): Promise<{ status: number; body: unknown }> {
    const headers: Record<string, string> = {
      authorization: `Bearer ${this.token}`,
      accept: "application/json",
    };
    if (call.organizationId !== undefined) headers["x-zitadel-orgid"] = call.organizationId;
    let body: string | undefined;
    if (call.json !== undefined) {
      headers["content-type"] = "application/json";
      body = JSON.stringify(call.json);
    } else if (call.form !== undefined) {
      headers["content-type"] = "application/x-www-form-urlencoded";
      body = new URLSearchParams(call.form).toString();
    }
    let response: Response;
    try {
      response = await globalThis.fetch(`${this.base}${call.path}`, {
        method: call.method,
        headers,
        ...(body === undefined ? {} : { body }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw IdpAdminUnavailableError.create({}, { cause: error });
    }
    const { status } = response;
    if (!response.ok && !allowed.includes(status)) {
      const cause = new Error(`ZITADEL answered ${status} to ${call.method} ${call.path}`);
      if (status === 409) throw IdpUserExistsError.create({}, { cause });
      if (status === 429 || status >= 500) throw IdpAdminUnavailableError.create({}, { cause });
      throw cause;
    }
    const text = await response.text();
    return { status, body: text === "" ? {} : (JSON.parse(text) as unknown) };
  }
}

/**
 * Throws `UnauthenticatedError` when `status` is one of `refused`.
 *
 * @throws UnauthenticatedError on a refused passkey check or an unknown login or user.
 */
function refuseOn(status: number, refused: readonly number[]): void {
  if (refused.includes(status)) throw UnauthenticatedError.create();
}

/**
 * The WebAuthn options object of a provider answer, passed through unread.
 *
 * @throws Error when the answer lacks it.
 */
function objectOf<T>(value: unknown): T {
  if (typeof value !== "object" || value === null)
    throw new Error("ZITADEL's answer has no publicKey options");
  return value as T;
}

/**
 * The string `field` of a provider answer.
 *
 * @throws Error when the answer lacks it.
 */
function stringOf(body: unknown, field: string): string {
  const value = (body as Record<string, unknown> | null)?.[field];
  if (typeof value !== "string" || value === "")
    throw new Error(`ZITADEL's answer has no ${field}`);
  return value;
}

/**
 * The number `field` of a provider answer.
 *
 * @throws Error when the answer lacks it.
 */
function numberOf(body: unknown, field: string): number {
  const value = (body as Record<string, unknown> | null)?.[field];
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new Error(`ZITADEL's answer has no ${field}`);
  return value;
}
