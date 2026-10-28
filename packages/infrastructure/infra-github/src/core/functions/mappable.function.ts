/**
 * Stackra file contract:
 * Purpose: `mappable(shape)`, the zod object for one block of a committed GitHub rules file: the settings the Pulumi
 *          GitHub provider applies are typed by `shape`; any other setting passes only while it is off (`false`,
 *          `null`, an empty list or `{ enabled: false }`), because a setting that is on but cannot be applied would
 *          make the program claim a protection GitHub does not have.
 * Boundary: internal; the ruleset and branch protection schemas build their blocks with it. GitHub adds settings
 *           over time, so an off one is accepted rather than refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decision 8: rulesets through the Pulumi GitHub provider).
 */
import { z } from "zod";

/**
 * A loose object of `shape` that refuses an unmapped setting that is on.
 *
 * @example
 * mappable({ strict: z.boolean().optional() }).parse({ strict: true, lock: false }); // ok: `lock` is off
 * mappable({ strict: z.boolean().optional() }).parse({ lock: true }); // fails at `lock`
 */
export function mappable<T extends z.core.$ZodShape>(
  shape: T,
): z.ZodObject<z.core.util.Writeable<T>, z.core.$loose> {
  return z.looseObject(shape).superRefine((value, ctx) => {
    for (const [key, setting] of Object.entries(value)) {
      const off =
        setting === false ||
        setting === null ||
        (Array.isArray(setting) && setting.length === 0) ||
        (typeof setting === "object" &&
          setting !== null &&
          (setting as { enabled?: unknown }).enabled === false);
      if (Object.hasOwn(shape, key) || off) continue;
      ctx.addIssue({
        code: "custom",
        path: [key],
        message:
          "The Pulumi GitHub provider cannot apply this setting: turn it off here, or set it in GitHub by hand and remove it",
      });
    }
  });
}
