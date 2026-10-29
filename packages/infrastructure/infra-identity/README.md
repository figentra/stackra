# @stackra/infra-identity

Identity infrastructure over ZITADEL (ADR 0171, ADR 0206): the seed that names what every instance holds, the plan of
one instance read from the root runway and the seed, and the slice of the generated Pulumi program that creates it.

**Tier:** `tier:lib` (`packages/infrastructure/infra-identity`). Entries `.` (isomorphic, no Pulumi) and `./node` (the
seed reader and the Pulumi slice). Depends on `@stackra/contracts`, `@stackra/runway`, zod, yaml, `@pulumi/pulumi` and
`@pulumiverse/zitadel`.

## What is here

| Entry    | Symbol                                                 | Use                                                                                                            |
| -------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `.`      | `parseIdentitySeed(document, source?)`                 | check a parsed `.stackra/zitadel/seed.yaml` (format version 1)                                                 |
| `.`      | `identityPlan(root, seed, instance)`                   | what one ZITADEL instance holds, from the root runway and the seed                                             |
| `.`      | `IdentityAppKind`, `InstanceRole`                      | enums: `bff` or `native`; ZITADEL's instance roles in snake_case                                               |
| `.`      | `IdentityInfraInvalidError`                            | every seed or runway failure at once, with its path                                                            |
| `.`      | `IdentityHealthIndicatorDriver`, `InfraIdentityConfig` | the `HealthIndicator` driver: the issuer's discovery document is served; its target is `config.infra_identity` |
| `.`      | `IdentitySeed`, `IdentityPlan`, `IdentityPlanApp`      | types (`IdentityPlan.appleSignIn`: the Apple ids and key secret name, or `null`)                               |
| `./node` | `readIdentitySeed(file)`                               | read, YAML-parse and check a seed file                                                                         |
| `./node` | `identityStack(plan)`                                  | inside the Pulumi program: create the instance's resources, export the ids                                     |

## Instances

The root runway names each ZITADEL instance, its domain (the issuer's host) and the runway environments it serves. A
hosted instance serves several environments: the non-production instance serves dev builds, preview and staging, and
the production instance serves production (ADR 0290 decision 8). Each instance is one Pulumi stack.

```yaml
# runway.yaml (root)
providers:
  zitadel:
    instances:
      nonprod:
        domain: id.staging.acme.example
        environments: [dev, preview, staging]
      prod:
        domain: id.acme.example
        environments: [production]
```

## The seed

Gen writes `.stackra/zitadel/seed.yaml` from each app's identity config, the role catalogue and the brand; the local
dev container (`stackra dev`) and every hosted instance read the same file.

```yaml
version: 1
org:
  name: Acme staff # the staff organisation: one global account per staff member (ADR 0206 decision 5)
project:
  name: acme-platform
  roles:
    - key: platform_admin # a role code (ADR 0208)
      name: Platform administrator
      group: platform
apps:
  console:
    kind: bff # code and PKCE through the web BFF
    redirectUris:
      dev:
        - http://localhost:5173/api/auth/callback
      staging:
        - https://console.staging.acme.example/api/auth/callback
      production:
        - https://console.acme.example/api/auth/callback
  mobile:
    kind: native # code and PKCE on a custom scheme
    tokenExchange: true # narrow tokens for native surfaces (ADR 0345 decision 3)
    redirectUris:
      staging:
        - acme://auth/callback
      production:
        - acme://auth/callback
  cli:
    kind: native
    deviceCode: true # headless sign-in (ADR 0277 decision 2)
    redirectUris:
      production:
        - http://127.0.0.1/callback
machines:
  identity:
    name: Identity service
    instanceRoles: [org_manager, user_manager] # tenant organisations, their login policies and users (IdpAdmin)
users: # the local dev container only
  - userName: dev
    email: dev@acme.example
    firstName: Dev
    lastName: User
branding:
  light:
    primary: "#1f6feb"
    background: "#ffffff"
    warn: "#cf222e"
    font: "#1f2328"
  dark:
    primary: "#4493f8"
    background: "#0d1117"
    warn: "#f85149"
    font: "#f0f6fc"
appleSignIn: # optional; Sign in with Apple, off without it (STA-1578)
  teamId: TEAM000001 # the Apple Developer team id
  serviceId: example.acme.signin # the Sign in with Apple services id
  keyId: KEY0000001 # the Sign in with Apple key's id
  privateKeySecret: APPLE_SIGN_IN_KEY # the NAME of the stack config secret holding the .p8 key, never the key
```

An instance holds the callbacks of the environments it serves; an app with none there (and no device code) gets no
client on it. ZITADEL matches a callback exactly, so a pattern such as `${pr}` is refused: the preview job registers a
pull request's own callback. A BFF calls back on `https://`, or on `http://` in ZITADEL's dev mode on an instance that
serves no production; a native app on a custom scheme, `https://` or a loopback `http://` address.

## The stack

```ts
// .stackra/infra/identity.ts (generated by `stackra infra gen`), stack `identity-nonprod`
import { identityPlan } from "@stackra/infra-identity";
import { identityStack, readIdentitySeed } from "@stackra/infra-identity/node";
import { readRunway } from "@stackra/runway/node";

const plan = identityPlan(
  readRunway("runway.yaml", "root"),
  readIdentitySeed(".stackra/zitadel/seed.yaml"),
  "nonprod",
);
export const identity = identityStack(plan);
```

| Resource                | Settings                                                                                               | Source                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------- |
| Instance OIDC settings  | access and id tokens 10 minutes; refresh tokens 30 days                                                | ADR 0206 d8, ADR 0277 d4   |
| Instance password rule  | at least 12 characters, no composition rules                                                           | ADR 0207 d3 (ASVS level 1) |
| Instance lockout policy | locked after 5 failed password checks; OTP keeps ZITADEL's default (provider 0.2.0 has no OTP limit)   | STA-1580 (ASVS 2.2.1)      |
| Instance label policy   | the seed's colours, when it has them                                                                   | ADR 0268 R3                |
| Staff organisation      | second factor forced, no self-registration, no external provider, checks every 12 hours                | ADR 0206 d5, ADR 0207 d3   |
| Project and roles       | roles asserted in tokens; a user's own organisation brands the sign-in pages                           | ADR 0208, ADR 0268 R3      |
| One OIDC client per app | code with PKCE and no secret, JWT access tokens, roles asserted; device code and token exchange on ask | ADR 0206 d8, ADR 0277      |
| Machine users           | JWT access tokens, instance roles and project roles from the seed                                      | ADR 0207 d2                |
| Apple identity provider | the seed's Apple ids and the named key; allowed on the default login policy; only when `appleSignIn`   | STA-1578 (App Store 4.8)   |

The outputs are ids, never a secret: `issuer`, `orgId`, `projectId`, `clients.<app>` (what a runway's
`ref:identity.clients.<app>.<instance>` names in the stacks repository's stack config), `machines.<key>` and
`firstPartyClients` (the gateway's first-party list, exempt from the app-grant check, ADR 0274 decision 5) and
`appleIdp` (the Apple provider's id, or `null`: what `@stackra/identity`'s `IdentityConfig.externalProviders.apple`
names).

`@pulumiverse/zitadel` 0.2.0 has no Apple resource, so the Apple provider is a Pulumi dynamic resource over ZITADEL's
admin API (`POST /admin/v1/idps/apple`, then `POST /admin/v1/policies/login/idps`). It signs in with the
provisioner's key; the state keeps the Apple ids and a SHA-256 of the `.p8` key (to see a rotation), never the key, and
the provisioner's key only as an encrypted Pulumi secret, which a delete needs.

## Owner steps

Agents run `pulumi preview` at most; `pulumi up` is the owner's. Before the first run the owner:

- creates the ZITADEL Cloud instance and its custom domain (the root runway's `domain`; the CNAME is Cloudflare's);
- creates the provisioner, a machine user with `IAM_OWNER`, and sets its key as the secret stack config value
  `zitadel:jwtProfileJson`;
- after `up`, creates each machine user's key and imports it into Infisical through `pnpm secrets:import` (ADR 0173);
  the `identity` machine's token is `@stackra/identity`'s `IDENTITY_IDP_ADMIN_TOKEN` (the `IdpAdmin` ZITADEL driver);
- turns on token exchange on the instance when an app asks for it;
- for Sign in with Apple (STA-1557): in the Apple Developer account, enables Sign in with Apple on each app id,
  creates a services id with ZITADEL's Apple return URL (`https://<domain>/ui/login/login/externalidp/callback/form`, as ZITADEL's Apple guide gives it) and the instance
  domain as its domain, creates a Sign in with Apple key, puts the team id, services id and key id in the seed's
  `appleSignIn`, and sets the `.p8` key as the secret stack config value `zitadel:<privateKeySecret>` (Infisical
  first, ADR 0173 and ADR 0257);
- adds the other external sign-in providers and uploads the logos (not in this stack).
