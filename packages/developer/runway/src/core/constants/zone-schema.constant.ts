/**
 * Stackra file contract:
 * Purpose: `ZONE_SCHEMA`, one entry of `providers.cloudflare.zones`: a zone id (a plain value or `ref:`, the form every
 *          repository uses today), or a closed object with the zone's `id`, whether this root runway is its `owner`, its
 *          Cloudflare `plan` and the zone `policy` preset (`baseline`, then `strict` from Pro).
 * Boundary: internal; validation only. A policy the plan does not have is refused here, and an owner must state its
 *           plan, so the policy it applies is checked against it. That two roots claim one zone is `checkZoneOwners`'s,
 *           which sees more than one runway. infra-cloudflare applies the policy.
 * Runtime: isomorphic
 * Governing contract: ADR 0519 (decisions 5 and 6: one owner per zone, the baseline policy), ADR 0175, ADR 0290
 *                     (decision 13: Free until paying users); STA-1993.
 */
import { z } from "zod";

/** A zone id: a plain value, or `ref:<path>` resolved from the stacks repository. */
const VALUE = z.union([z.string(), z.number(), z.boolean()]);

/** The id as a plain value or `ref:`; the object form below carries the rest. */
export const ZONE_SCHEMA = z.union([
  VALUE,
  z
    .strictObject({
      id: VALUE,
      /** True in exactly one root runway per zone; every other repository only reads the id. */
      owner: z.boolean().optional(),
      plan: z.enum(["free", "pro"]).optional(),
      /** A zone preset: `baseline` from any plan, `strict` from Pro. */
      policy: z.enum(["baseline", "strict"]).optional(),
    })
    .superRefine((zone, context) => {
      if (zone.owner === true && zone.plan === undefined)
        context.addIssue({
          code: "custom",
          path: ["plan"],
          message: "The owner of a zone states its plan, which decides what the policy may ask for",
        });
      if (zone.policy === "strict" && zone.plan !== "pro")
        context.addIssue({
          code: "custom",
          path: ["policy"],
          message: "The strict policy needs plan: pro",
        });
      if (zone.policy !== undefined && zone.owner !== true)
        context.addIssue({
          code: "custom",
          path: ["policy"],
          message: "Only the owner of a zone sets its policy",
        });
    }),
]);
