/**
 * Stackra file contract:
 * Purpose: `BUNDLE_MANIFEST_SCHEMA`, the zod shape of the `bundle.manifest.json` fields the publish step reads; every
 *          path is relative to the bundle folder and may not climb out of it.
 * Boundary: internal; `readBundles` parses with it. Loose: fields the step does not read (`pro`) pass through.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 4); app-shells 4.2 and 15 (points 7 and 8).
 */
import { z } from "zod";

/** A file inside the bundle folder. */
const FILE = z
  .string()
  .regex(
    /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/@-]+$/,
    "Expected a file inside the bundle",
  );

/** The manifest of one built bundle. */
export const BUNDLE_MANIFEST_SCHEMA = z.looseObject({
  package: z.string().min(1),
  surface: z.string().regex(/^[a-z][a-z0-9-]*$/, "Expected a surface code"),
  targets: z.string().regex(/^[a-z][a-z0-9-]*@[0-9]+$/, "Expected <surface>@<major>"),
  version: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9.+_-]*$/, "Expected a version"),
  entry: FILE,
  modulepreload: z.array(FILE),
  css: z.array(FILE),
  imports: z.array(z.string()),
});
