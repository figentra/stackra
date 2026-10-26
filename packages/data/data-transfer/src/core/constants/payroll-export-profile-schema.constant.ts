/**
 * Stackra file contract:
 * Purpose: `PAYROLL_EXPORT_PROFILE_SCHEMA`, the shape of a per-provider payroll export profile: the provider, the file
 *          format (`csv`, `xlsx`, `datev-ascii`), the columns and what fills each, the pay item to wage code map, number
 *          and date formats, and for DATEV the `[Allgemein]` entries and the record description.
 * Boundary: mechanism only. The profiles are seed data (`assets/data/payroll-export-profiles/`, editable per tenant);
 *           the tenant's own values (DATEV consultant and client numbers, its wage codes) are merged in by the caller.
 * Runtime: isomorphic
 * Governing contract: ADR 0431 (decision 4); config-model (configuration, not code); owner R3-SO-05.
 */
import { z } from "zod";

/**
 * The payroll export profile schema.
 *
 * @example
 * const profile = PAYROLL_EXPORT_PROFILE_SCHEMA.parse(seedRow.value);
 */
export const PAYROLL_EXPORT_PROFILE_SCHEMA = z
  .object({
    key: z.string().min(1),
    provider: z.string().min(1),
    format: z.enum(["csv", "xlsx", "datev-ascii"]),
    sheet: z.string().min(1),
    columns: z
      .array(
        z.object({
          header: z.string().min(1),
          field: z.enum([
            "employee",
            "item",
            "code",
            "quantity",
            "amount",
            "currency",
            "periodStart",
            "periodEnd",
            "literal",
          ]),
          value: z.string().optional(),
        }),
      )
      .min(1),
    codes: z.record(z.string(), z.string()),
    decimalSeparator: z.enum([".", ","]),
    dateFormat: z.enum(["iso", "dd/mm/yyyy", "mm/dd/yyyy", "dd.mm.yyyy"]),
    delimiter: z.string().length(1).optional(),
    datev: z
      .object({
        general: z.record(z.string(), z.string()),
        recordTable: z.string().min(1),
        recordNumber: z.number().int().positive(),
      })
      .optional(),
  })
  .superRefine((profile, context) => {
    if (profile.format === "datev-ascii" && profile.datev === undefined)
      context.addIssue({
        code: "custom",
        path: ["datev"],
        message: "A DATEV profile needs its datev section",
      });
    profile.columns.forEach((column, index) => {
      if (column.field === "literal" && column.value === undefined)
        context.addIssue({
          code: "custom",
          path: ["columns", index, "value"],
          message: "A literal column needs a value",
        });
    });
  });
