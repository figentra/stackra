/**
 * Stackra file contract:
 * Purpose: `CONTRIBUTION_SCHEMA`, what a product adds to the one ops console: the package that carries it, or the
 *          package with its panels, resources and widgets, each a key over a registered block with data props.
 * Boundary: internal; the surfaces schema composes it for the `ops` surface only. Declarative only: an entry is
 *           closed (a `component`, `entry` or `script` key fails) and its `block` names a registered block id, never
 *           a module path or an export, so no arbitrary component reaches staff sessions. That the package's own
 *           manifest holds only such entries, and the second-reviewer gate, are the publish step's (stackra-07).
 * Runtime: isomorphic
 * Governing contract: ADR 0436 (D1: one ops console on its own host), app-shells section 16 point 7 (ops
 *                     contributions are declarative only), ADR 0441 (decision 3: `contributes`).
 */
import { z } from "zod";

import { KEY_SCHEMA } from "#core/constants/key-schema.constant";
import { OPEN_OBJECT_SCHEMA } from "#core/constants/open-object-schema.constant";
import { PACKAGE_NAME_SCHEMA } from "#core/constants/package-name-schema.constant";

/** One panel, resource or widget: a key, the registered block it renders (`os/table`) and data props. */
const ENTRY = z.strictObject({
  key: KEY_SCHEMA,
  block: z
    .string()
    .regex(
      /^[a-z][a-z0-9-]*\/[a-z][a-z0-9.-]*$/,
      "Expected a registered block id such as os/table",
    ),
  title: z.string().optional(),
  props: OPEN_OBJECT_SCHEMA.optional(),
});

/** `"@figentra/mezzora-ops-ui"`, or `{ package, panels, resources, widgets }`. */
export const CONTRIBUTION_SCHEMA = z.union([
  PACKAGE_NAME_SCHEMA,
  z.strictObject({
    package: PACKAGE_NAME_SCHEMA,
    panels: z.array(ENTRY).optional(),
    resources: z.array(ENTRY).optional(),
    widgets: z.array(ENTRY).optional(),
  }),
]);
