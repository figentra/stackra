/**
 * Stackra file contract:
 * Purpose: `SURFACE_SCHEMA`, one `surfaces.<surface>` entry of the root runway: the shell line it targets, the
 *          packages its extension bundle is built from, the landing seed folder (`content`), the platform host
 *          relative to the environment's zone, the ops declarations package (`contributes`) and the product's own app
 *          member with its ADR, when one serves the surface.
 * Boundary: internal; the root runway schema composes it. Strict. Which keys a surface may use (ops contributes only,
 *           `content` on landing only) is `checkSurfaces`'s, so each refusal names its rule.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 3), ADR 0436 (decisions 3, 4, 9 and 11), ADR 0440 (decision 2).
 */
import { z } from "zod";

import { APP_MEMBER_REFERENCE_SCHEMA } from "#core/constants/app-member-reference-schema.constant";
import { ASSET_PATH_SCHEMA } from "#core/constants/asset-path-schema.constant";
import { HOST_NAME_SCHEMA } from "#core/constants/host-name-schema.constant";
import { PACKAGE_LIST_SCHEMA } from "#core/constants/package-list-schema.constant";
import { PACKAGE_NAME_SCHEMA } from "#core/constants/package-name-schema.constant";
import { SHELL_LINE_SCHEMA } from "#core/constants/shell-line-schema.constant";

/** `{ shell: "os/console@3", packages: ["@mezzora/console-ui"], host: "console.mezzora" }`. */
export const SURFACE_SCHEMA = z.strictObject({
  shell: SHELL_LINE_SCHEMA.optional(),
  packages: PACKAGE_LIST_SCHEMA.optional(),
  content: ASSET_PATH_SCHEMA.optional(),
  host: HOST_NAME_SCHEMA.optional(),
  contributes: PACKAGE_NAME_SCHEMA.optional(),
  app: APP_MEMBER_REFERENCE_SCHEMA.optional(),
});
