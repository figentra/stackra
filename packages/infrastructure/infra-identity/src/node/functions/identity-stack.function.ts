/**
 * Stackra file contract:
 * Purpose: `identityStack(plan)`, the identity slice of the Pulumi program `stackra infra gen` composes, one stack per
 *          ZITADEL instance: the instance's token lifetimes, password rule and branding, the staff organisation with
 *          its sign-in policy, the project and its roles, one OIDC client per app, and the machine users with their
 *          instance and project roles, and the Apple identity provider when the plan turns it on.
 * Boundary: runs inside a Pulumi program. The provider signs in with the provisioner's key from the stack config
 *           (`zitadel:jwtProfileJson`, a secret the owner sets); the Apple `.p8` key is the secret stack config value
 *           the plan names (`zitadel:<privateKeySecret>`), never in the seed. The instance itself, its custom domain,
 *           machine keys, the Apple ids and other external sign-in providers are owner steps. Every client is code with PKCE and no secret, so the stack
 *           holds no secret value. Agents run `pulumi preview` at most; `up` is the owner's.
 * Runtime: node
 * Governing contract: ADR 0171 (decisions 2 to 5), ADR 0206 (decisions 3, 5 and 8), ADR 0207 (decisions 2 and 3),
 *                     ADR 0268 (R3: ZITADEL's own branding), ADR 0274 (decision 5), ADR 0277 (decisions 1, 2 and 4),
 *                     ADR 0345 (decision 3), ADR 0173 (the Apple key by name), STA-1578 (App Store guideline 4.8).
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import { Config, all, dynamic } from "@pulumi/pulumi";
import type { Output } from "@pulumi/pulumi";
import * as zitadel from "@pulumiverse/zitadel";

import { IdentityAppKind } from "#core/enums/identity-app-kind.enum";
import type { IdentityPlan } from "#core/types/identity-plan.type";
import { APPLE_IDP_PROVIDER } from "#node/constants/apple-idp-provider.constant";
import type { IdentityStack } from "#node/types/identity-stack.type";

/** Twelve hours, the staff session cap (ADR 0207 decision 3, ADR 0277 decision 4). */
const STAFF_CHECK = "12h0m0s";

/**
 * Creates one instance's identity resources.
 *
 * @param plan - the plan `identityPlan` built for this instance.
 * @throws Error (Pulumi's missing-configuration error) when `zitadel:jwtProfileJson`, or the Apple key the plan
 *         names, is not set in the stack config.
 * @example
 * // .stackra/infra/identity.ts (generated), stack `identity-nonprod`
 * export const identity = identityStack(identityPlan(root, readIdentitySeed(".stackra/zitadel/seed.yaml"), "nonprod"));
 */
export function identityStack(plan: IdentityPlan): IdentityStack {
  const config = new Config("zitadel");
  const jwtProfileJson = config.requireSecret("jwtProfileJson");
  const provider = new zitadel.Provider("zitadel", { domain: plan.domain, jwtProfileJson });
  const options = { provider };

  // ADR 0206 decision 8 and 0277 decision 4: JWT access tokens last ten minutes; refresh tokens rotate and last 30 days.
  new zitadel.DefaultOidcSettings(
    "oidc",
    {
      accessTokenLifetime: "10m0s",
      idTokenLifetime: "10m0s",
      refreshTokenExpiration: "720h0m0s",
      refreshTokenIdleExpiration: "720h0m0s",
    },
    options,
  );
  // ADR 0207 decision 3 (ASVS level 1): at least 12 characters and no composition rules.
  new zitadel.DefaultPasswordComplexityPolicy(
    "password",
    { minLength: 12, hasUppercase: false, hasLowercase: false, hasNumber: false, hasSymbol: false },
    options,
  );
  if (plan.branding !== null) {
    const { light, dark } = plan.branding;
    new zitadel.DefaultLabelPolicy(
      "branding",
      {
        primaryColor: light.primary,
        backgroundColor: light.background,
        warnColor: light.warn,
        fontColor: light.font,
        primaryColorDark: dark.primary,
        backgroundColorDark: dark.background,
        warnColorDark: dark.warn,
        fontColorDark: dark.font,
        hideLoginNameSuffix: false,
        disableWatermark: false,
        setActive: true,
      },
      options,
    );
  }

  const org = new zitadel.Org("staff", { name: plan.org.name }, options);
  // ADR 0207 decision 3: staff are invited, use a second factor, and check again every twelve hours.
  new zitadel.LoginPolicy(
    "staff-login",
    {
      orgId: org.id,
      userLogin: true,
      allowRegister: false,
      allowExternalIdp: false,
      forceMfa: true,
      forceMfaLocalOnly: false,
      passwordlessType: "PASSWORDLESS_TYPE_ALLOWED",
      hidePasswordReset: false,
      ignoreUnknownUsernames: true,
      defaultRedirectUri: "",
      passwordCheckLifetime: STAFF_CHECK,
      externalLoginCheckLifetime: STAFF_CHECK,
      multiFactorCheckLifetime: STAFF_CHECK,
      secondFactorCheckLifetime: STAFF_CHECK,
      mfaInitSkipLifetime: "0s",
      secondFactors: ["SECOND_FACTOR_TYPE_OTP", "SECOND_FACTOR_TYPE_U2F"],
      multiFactors: ["MULTI_FACTOR_TYPE_U2F_WITH_VERIFICATION"],
    },
    options,
  );

  // Roles reach the token (the template's roles scope); a tenant's organisation shows its own branding (ADR 0268 R3).
  const project = new zitadel.Project(
    "project",
    {
      orgId: org.id,
      name: plan.project.name,
      projectRoleAssertion: true,
      privateLabelingSetting: "PRIVATE_LABELING_SETTING_ALLOW_LOGIN_USER_RESOURCE_OWNER_POLICY",
    },
    options,
  );
  const roles = plan.project.roles.map(
    (role) =>
      new zitadel.ProjectRole(
        `role-${role.key}`,
        {
          orgId: org.id,
          projectId: project.id,
          roleKey: role.key,
          displayName: role.name,
          ...(role.group === undefined ? {} : { group: role.group }),
        },
        options,
      ),
  );

  const clients: Record<string, Output<string>> = {};
  for (const app of plan.apps) {
    clients[app.key] = new zitadel.ApplicationOidc(
      `app-${app.key}`,
      {
        orgId: org.id,
        projectId: project.id,
        name: app.key,
        appType: app.kind === IdentityAppKind.Bff ? "OIDC_APP_TYPE_WEB" : "OIDC_APP_TYPE_NATIVE",
        // Code with PKCE and no client secret, on the web BFF as on devices (ADR 0206 decision 8).
        authMethodType: "OIDC_AUTH_METHOD_TYPE_NONE",
        responseTypes: ["OIDC_RESPONSE_TYPE_CODE"],
        grantTypes: [
          "OIDC_GRANT_TYPE_AUTHORIZATION_CODE",
          "OIDC_GRANT_TYPE_REFRESH_TOKEN",
          ...(app.deviceCode ? ["OIDC_GRANT_TYPE_DEVICE_CODE"] : []),
          ...(app.tokenExchange ? ["OIDC_GRANT_TYPE_TOKEN_EXCHANGE"] : []),
        ],
        redirectUris: [...app.redirectUris],
        postLogoutRedirectUris: [...app.postLogoutRedirectUris],
        devMode: app.devMode,
        accessTokenType: "OIDC_TOKEN_TYPE_JWT",
        accessTokenRoleAssertion: true,
        idTokenRoleAssertion: true,
        idTokenUserinfoAssertion: true,
      },
      options,
    ).clientId;
  }

  const machines: Record<string, Output<string>> = {};
  for (const [key, machine] of Object.entries(plan.machines)) {
    const user = new zitadel.MachineUser(
      `machine-${key}`,
      {
        orgId: org.id,
        userName: key,
        name: machine.name,
        ...(machine.description === undefined ? {} : { description: machine.description }),
        accessTokenType: "ACCESS_TOKEN_TYPE_JWT",
      },
      options,
    );
    if (machine.instanceRoles.length > 0) {
      new zitadel.InstanceMember(
        `machine-${key}-instance`,
        {
          userId: user.id,
          roles: machine.instanceRoles.map((role) => `IAM_${role.toUpperCase()}`),
        },
        options,
      );
    }
    if (machine.roles.length > 0) {
      new zitadel.UserGrant(
        `machine-${key}-grant`,
        { orgId: org.id, projectId: project.id, userId: user.id, roleKeys: [...machine.roles] },
        { ...options, dependsOn: roles },
      );
    }
    machines[key] = user.id;
  }

  // App Store guideline 4.8: Sign in with Apple beside every social provider; the provider has no Apple resource.
  const appleIdp =
    plan.appleSignIn === null
      ? null
      : // dynamic.Resource is abstract, so the provider gets an empty subclass of its own
        new (class AppleIdentityProvider extends dynamic.Resource {})(
          APPLE_IDP_PROVIDER,
          "apple-idp",
          {
            domain: plan.domain,
            jwtProfileJson,
            clientId: plan.appleSignIn.serviceId,
            teamId: plan.appleSignIn.teamId,
            keyId: plan.appleSignIn.keyId,
            privateKey: config.requireSecret(plan.appleSignIn.privateKeySecret),
          },
          { additionalSecretOutputs: ["jwtProfileJson"] },
        ).id;

  return {
    issuer: plan.issuer,
    orgId: org.id,
    projectId: project.id,
    clients,
    machines,
    firstPartyClients: all(Object.values(clients)),
    appleIdp,
  };
}
