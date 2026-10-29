/**
 * Stackra file contract:
 * Purpose: `IDENTITY_SEED_SCHEMA`, the format of `.stackra/zitadel/seed.yaml` (version 1): the staff organisation, the
 *          project and its roles, one OIDC client per app with its redirect URIs per runway environment, the machine
 *          users with their instance and project roles, the dev users of the local container, the branding of
 *          the hosted sign-in pages, and Sign in with Apple (off unless the block is there).
 * Boundary: internal; `parseIdentitySeed` reads it. Strict everywhere, so a misspelt key fails. The cross-field rules
 *           sit here too: a role is declared once, every role a machine or a dev user holds is a project role, and the
 *           device code and token exchange belong to a native app. Which URIs reach an instance, and whether each is
 *           allowed there, is `identityPlan`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decisions 4, 5 and 8), ADR 0207 (decision 2), ADR 0208 (role codes), ADR 0268 (R3:
 *                     ZITADEL's own branding), ADR 0277 (decision 2), ADR 0345 (decision 3: token exchange), ADR 0199
 *                     (decision 3: the seeded dev container), ADR 0173 and ADR 0257 (the Apple key by secret name only),
 *                     STA-1578 (App Store guideline 4.8).
 */
import { Enum } from "@stackra/contracts";
import { RunwayEnvironment } from "@stackra/runway";
import { z } from "zod";

import { IdentityAppKind } from "#core/enums/identity-app-kind.enum";
import { InstanceRole } from "#core/enums/instance-role.enum";

/** A runway environment name. */
const ENVIRONMENT = z.enum(
  Enum.values(RunwayEnvironment) as [RunwayEnvironment, ...RunwayEnvironment[]],
);

/** An app or service member key, the folder name (`console`, `identity`). */
const MEMBER_KEY = z.string().regex(/^[a-z][a-z0-9-]*$/, "Expected a member key in kebab-case");

/** A role code (ADR 0208), snake_case like every machine code. */
const ROLE_KEY = z.string().regex(/^[a-z][a-z0-9_]*$/, "Expected a snake_case role code");

/** A display name. */
const NAME = z.string().trim().min(1);

/** The URIs of one app per runway environment. */
const URIS = z.partialRecord(ENVIRONMENT, z.array(z.string().min(1)).min(1));

/** A `#rrggbb` colour, the form ZITADEL's label policy takes. */
const HEX = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Expected a #rrggbb colour");

/** The four colours of one scheme of the hosted pages. */
const PALETTE = z.strictObject({ primary: HEX, background: HEX, warn: HEX, font: HEX });

/** An Apple Developer team id or key id: ten upper-case letters and digits. */
const APPLE_ID = z.string().regex(/^[A-Z0-9]{10}$/, "Expected ten upper-case letters and digits");

/**
 * Sign in with Apple: the Apple ids the owner creates, and the NAME of the secret stack config value holding the
 * `.p8` key (ADR 0173: never the value).
 */
const APPLE_SIGN_IN = z.strictObject({
  teamId: APPLE_ID,
  serviceId: z
    .string()
    .regex(
      /^[A-Za-z][A-Za-z0-9-]*(\.[A-Za-z0-9-]+)+$/,
      "Expected an Apple services id in reverse-DNS",
    ),
  keyId: APPLE_ID,
  privateKeySecret: z
    .string()
    .regex(/^[A-Z][A-Z0-9_]*$/, "Expected a secret name in SCREAMING_SNAKE"),
});

/** The schema of `.stackra/zitadel/seed.yaml`, version 1. */
export const IDENTITY_SEED_SCHEMA = z
  .strictObject({
    version: z.literal(1),
    org: z.strictObject({ name: NAME }),
    project: z.strictObject({
      name: NAME,
      roles: z
        .array(z.strictObject({ key: ROLE_KEY, name: NAME, group: NAME.optional() }))
        .default([]),
    }),
    apps: z
      .record(
        MEMBER_KEY,
        z.strictObject({
          kind: z.enum(Enum.values(IdentityAppKind) as [IdentityAppKind, ...IdentityAppKind[]]),
          redirectUris: URIS.default({}),
          postLogoutRedirectUris: URIS.default({}),
          deviceCode: z.boolean().default(false),
          tokenExchange: z.boolean().default(false),
        }),
      )
      .default({}),
    machines: z
      .record(
        MEMBER_KEY,
        z.strictObject({
          name: NAME,
          description: NAME.optional(),
          instanceRoles: z
            .array(z.enum(Enum.values(InstanceRole) as [InstanceRole, ...InstanceRole[]]))
            .default([]),
          roles: z.array(ROLE_KEY).default([]),
        }),
      )
      .default({}),
    users: z
      .array(
        z.strictObject({
          userName: NAME,
          email: z.email(),
          firstName: NAME,
          lastName: NAME,
          roles: z.array(ROLE_KEY).default([]),
        }),
      )
      .default([]),
    branding: z.strictObject({ light: PALETTE, dark: PALETTE }).optional(),
    appleSignIn: APPLE_SIGN_IN.optional(),
  })
  .superRefine((seed, context) => {
    const roles = new Set<string>();
    seed.project.roles.forEach((role, index) => {
      if (roles.has(role.key)) {
        context.addIssue({
          code: "custom",
          path: ["project", "roles", index, "key"],
          message: `Role ${role.key} is declared twice`,
        });
      }
      roles.add(role.key);
    });
    const held = (path: (string | number)[], keys: readonly string[]): void => {
      keys.forEach((key, index) => {
        if (!roles.has(key)) {
          context.addIssue({
            code: "custom",
            path: [...path, index],
            message: `${key} is not a project role`,
          });
        }
      });
    };
    for (const [key, app] of Object.entries(seed.apps)) {
      if (app.kind === IdentityAppKind.Bff && (app.deviceCode || app.tokenExchange)) {
        context.addIssue({
          code: "custom",
          path: ["apps", key, "kind"],
          message: "The device code and token exchange belong to a native app",
        });
      }
    }
    for (const [key, machine] of Object.entries(seed.machines))
      held(["machines", key, "roles"], machine.roles);
    seed.users.forEach((user, index) => held(["users", index, "roles"], user.roles));
  });
