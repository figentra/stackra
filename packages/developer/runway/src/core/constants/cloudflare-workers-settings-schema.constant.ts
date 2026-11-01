/**
 * Stackra file contract:
 * Purpose: `CLOUDFLARE_WORKERS_SETTINGS_SCHEMA`, the `targets.cloudflare-workers` block the `cloudflare-workers`
 *          provider reads: each Worker member by key, with its folder, the deploy kind it ships under, the placeholder
 *          binding ids it swaps for real ones, its D1 databases, its plain vars and secrets (names), and its smoke URL.
 *          Other keys (`compatibilityDate`, the old per-member `workflows`) pass through untouched.
 * Boundary: internal; names only. Values (ids, vars, secrets) come from the deploy job's environment, never runway.yaml.
 * Runtime: isomorphic
 * Governing contract: ADR 0352 (decision 1), ADR 0284 (Workers members), ADR 0173 (names in git, values never).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { KEY_SCHEMA } from "#core/constants/key-schema.constant";
import { SECRET_NAMES_SCHEMA } from "#core/constants/secret-names-schema.constant";
import { DeployKind } from "#core/enums/deploy-kind.enum";

/** A folder below the repository root: relative, with no `..` segment. */
const MEMBER_PATH_SCHEMA = z
  .string()
  .regex(
    /^(?!\/)(?!.*(^|\/)\.\.(\/|$))[A-Za-z0-9._/-]+$/,
    "Expected a folder below the repository root",
  );

/** One Worker member. */
const MEMBER_SCHEMA = z.strictObject({
  path: MEMBER_PATH_SCHEMA,
  kind: z.enum(Enum.values(DeployKind) as [DeployKind, ...DeployKind[]]).default(DeployKind.Web),
  ids: z
    .record(
      z.string().regex(/^[A-Z][A-Z0-9_]*$/, "Expected a SCREAMING_SNAKE variable"),
      z.string().min(8),
    )
    .default({}),
  d1: z.array(z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "Expected a D1 database name")).default([]),
  vars: SECRET_NAMES_SCHEMA.default([]),
  secrets: SECRET_NAMES_SCHEMA.default([]),
  smoke: z.url({ protocol: /^https$/ }).optional(),
});

/** `targets.cloudflare-workers`. */
export const CLOUDFLARE_WORKERS_SETTINGS_SCHEMA = z.looseObject({
  members: z
    .record(KEY_SCHEMA, MEMBER_SCHEMA)
    .refine((members) => Object.keys(members).length > 0, "List a member"),
});
