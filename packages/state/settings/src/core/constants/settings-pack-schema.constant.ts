/**
 * Stackra file contract:
 * Purpose: `SETTINGS_PACK_SCHEMA`, the zod schema of `SettingsPack` (its `X$`): groups keyed by module key, each with
 *          its values by path and the paths it locks.
 * Boundary: shape only. A pack read from a YAML file or a promotion snapshot is untrusted input and is parsed with this
 *           schema. Group keys are module keys; paths are one or two dotted names; a value is a setting value (never
 *           an object, never a secret); a locked path must be one of the group's values.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 4); ADR 0307 (rules 22 and 23); ADR 0294 (decision 26: a package ships its
 *                     own `X$`).
 */
import { z } from "zod";

/** A setting path in its group: `name` or `section.name`. */
const PATH = z
  .string()
  .regex(/^[A-Za-z][A-Za-z0-9]*(\.[A-Za-z][A-Za-z0-9]*)?$/, "Expected a setting path");

/** The shipped `SettingsPack$`. */
export const SETTINGS_PACK_SCHEMA = z.object({
  groups: z.record(
    z.string().regex(/^[a-z][a-z0-9_]*$/, "Expected a module key"),
    z
      .object({
        values: z.record(PATH, z.union([z.boolean(), z.number(), z.string(), z.null()])),
        locked: z.array(PATH).default([]),
      })
      .refine((group) => group.locked.every((path) => Object.hasOwn(group.values, path)), {
        message: "A locked path must hold a value",
        path: ["locked"],
      }),
  ),
});
