/**
 * Stackra file contract:
 * Purpose: `SHELL_MANIFEST_SCHEMA`, the zod shape of a built web shell's `dist/shell.json`; every path is relative to
 *          `dist/` and may not climb out of it.
 * Boundary: internal; `shellReleaseOf` parses with it. Loose: fields Runway does not read pass through.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 4); ADR 0481.
 */
import { z } from "zod";

/** A file inside `dist/`. */
const FILE = z
  .string()
  .regex(
    /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/@-]+$/,
    "Expected a file inside the shell's dist",
  );

/** The manifest of one built shell. */
export const SHELL_MANIFEST_SCHEMA = z.looseObject({
  surface: z.string().regex(/^[a-z][a-z0-9-]*$/, "Expected a surface code"),
  line: z.string().regex(/^[0-9]+$/, "Expected a major"),
  version: z
    .string()
    .regex(/^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9.+-]+)?$/, "Expected a version"),
  entry: FILE,
  css: z.array(FILE),
  importMap: z.strictObject({ imports: z.record(z.string().min(1), FILE) }),
});
