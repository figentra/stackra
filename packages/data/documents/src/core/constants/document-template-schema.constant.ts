/**
 * Stackra file contract:
 * Purpose: `DOCUMENT_TEMPLATE_SCHEMA`, the zod schema of a print template: page, one or two locales with their
 *          direction, the bilingual layout and the blocks (text, table, QR, image, signature, amount in words).
 * Boundary: templates are studio data a tenant edits (ADR 0270 decision 1), so this is the trust boundary: no markup,
 *           no CSS and no code, only text with `{{path}}` placeholders and paths into the render data. A font is a
 *           family name only. `single` takes one locale; `side-by-side` and `stacked` take two, the first one primary.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decisions 1 and 2); ADR 0270 (decision 1); ADR 0154 (no tenant code).
 */
import { z } from "zod";

import { PRINT_DOCUMENT_KIND } from "#core/constants/print-document-kind.constant";

/** Text per locale code. */
const LOCALIZED_TEXT = z.record(z.string().min(1), z.string());

/** Logical alignment: `start` is the right edge in a right-to-left locale. */
const ALIGN = z.enum(["start", "center", "end"]).default("start");

/** A length in millimetres. */
const MILLIMETRES = z.number().positive();

/** A path into the render data (`order.lines`, `signer.image`). */
const PATH = z.string().regex(/^[\w$-]+(\.[\w$-]+)*$/u);

/** The blocks a print template places, top to bottom. */
const BLOCK = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    role: z.enum(["title", "heading", "body", "note"]).default("body"),
    text: LOCALIZED_TEXT,
    align: ALIGN,
  }),
  z.object({
    type: z.literal("table"),
    rows: PATH,
    columns: z.array(z.object({ header: LOCALIZED_TEXT, value: PATH, align: ALIGN })).min(1),
  }),
  z.object({
    type: z.literal("qr"),
    value: z.string().min(1),
    sizeMm: MILLIMETRES,
    errorCorrection: z.enum(["L", "M", "Q", "H"]).default("M"),
    align: ALIGN,
  }),
  z.object({
    type: z.literal("image"),
    image: PATH,
    widthMm: MILLIMETRES,
    heightMm: MILLIMETRES,
    align: ALIGN,
  }),
  z.object({
    type: z.literal("signature"),
    image: PATH,
    label: LOCALIZED_TEXT,
    widthMm: MILLIMETRES,
    heightMm: MILLIMETRES,
    align: ALIGN,
  }),
  z.object({
    type: z.literal("amount-in-words"),
    amount: PATH,
    currency: PATH,
    prefix: LOCALIZED_TEXT.optional(),
    suffix: LOCALIZED_TEXT.optional(),
    align: ALIGN,
  }),
]);

/** The shipped schema of a print template. */
export const DOCUMENT_TEMPLATE_SCHEMA = z
  .object({
    kind: z.literal(PRINT_DOCUMENT_KIND),
    name: z.string().min(1),
    version: z.string().min(1),
    page: z.object({
      widthMm: MILLIMETRES,
      heightMm: MILLIMETRES.optional(),
      marginMm: z.number().nonnegative(),
    }),
    locales: z
      .array(
        z.object({
          code: z.string().min(1),
          direction: z.enum(["ltr", "rtl"]),
          font: z
            .string()
            .regex(/^[\p{L}\p{N} _-]+$/u)
            .optional(),
        }),
      )
      .min(1)
      .max(2),
    layout: z.enum(["single", "side-by-side", "stacked"]).default("single"),
    blocks: z.array(BLOCK),
  })
  .superRefine((template, context) => {
    const wanted = template.layout === "single" ? 1 : 2;
    if (template.locales.length !== wanted)
      context.addIssue({
        code: "custom",
        path: ["locales"],
        message: `the ${template.layout} layout takes ${wanted} locale(s)`,
      });
    if (new Set(template.locales.map((locale) => locale.code)).size !== template.locales.length)
      context.addIssue({ code: "custom", path: ["locales"], message: "locale codes repeat" });
  });
