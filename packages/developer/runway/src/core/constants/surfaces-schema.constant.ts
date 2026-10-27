/**
 * Stackra file contract:
 * Purpose: `SURFACES_SCHEMA`, the root runway's `surfaces`: per web surface (console, landing, till, portal, …) the
 *          shell line, an optional preset, the product packages it loads, its host or hosts (one canonical) and, for
 *          a landing site, the seed `content` under `assets/`; and `ops`, which holds only the product's declarative
 *          `contributes`.
 * Boundary: internal; the root runway schema composes it. Strict per surface, so an unknown key fails. `ops` has no
 *           shell, packages or host: the OS ships the one ops console (D1) and a product only contributes to it.
 *           Building, publishing and the `host:` rows are the publish step's.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 3), ADR 0436, ADR 0437 (D2: canonical host), app-shells sections 8.2 and
 *                     16 point 7.
 */
import { z } from "zod";

import { ASSET_PATH_SCHEMA } from "#core/constants/asset-path-schema.constant";
import { CONTRIBUTION_SCHEMA } from "#core/constants/contribution-schema.constant";
import { PACKAGE_NAME_SCHEMA } from "#core/constants/package-name-schema.constant";
import { SHELL_LINE_SCHEMA } from "#core/constants/shell-line-schema.constant";

/** One web surface the product ships into an OS (or base product) shell. */
const SURFACE = z.strictObject({
  shell: SHELL_LINE_SCHEMA,
  preset: z
    .string()
    .regex(/^[a-z][a-z0-9-]*$/, "Expected a lower-case preset")
    .optional(),
  packages: z.array(PACKAGE_NAME_SCHEMA).optional(),
  host: z.string().min(1).optional(),
  hosts: z
    .array(z.strictObject({ host: z.string().min(1), canonical: z.boolean().optional() }))
    .refine(
      (hosts) => hosts.filter((entry) => entry.canonical === true).length <= 1,
      "At most one host is canonical",
    )
    .optional(),
  content: ASSET_PATH_SCHEMA.optional(),
});

/** Surface key to surface; `ops` holds only `contributes`. */
export const SURFACES_SCHEMA = z
  .object({ ops: z.strictObject({ contributes: CONTRIBUTION_SCHEMA }).optional() })
  .catchall(SURFACE);
