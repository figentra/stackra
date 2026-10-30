/**
 * Stackra file contract:
 * Purpose: `ApiDocSchema`, the runtime shape check of a generated `api/<platform>/<tier>/<slug>.json`.
 * Boundary: a zod schema only; the TypeScript type lives in `types/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 7.1; ADR 0095 (zod at the edges).
 */
import { z } from "zod";

import { Platform } from "#src/enums/platform.enum";

/** One API row. */
const API_PROP = z.strictObject({
  name: z.string(),
  type: z.string(),
  default: z.string().optional(),
  required: z.boolean(),
  description: z.string(),
  source: z.enum(["stackra", "heroui", "react-aria"]),
  replaces: z.string().optional(),
  deprecated: z.string().optional(),
});

/** The shape of a generated ApiDoc. */
export const ApiDocSchema = z.strictObject({
  key: z.string().regex(/^(free|pro)\/[a-z0-9-]+$/),
  platform: z.enum(Platform),
  importLine: z.string(),
  generatedFrom: z.strictObject({
    propsFiles: z.array(z.string()),
    heroDoc: z.string().optional(),
    hash: z.string(),
  }),
  parts: z.array(
    z.strictObject({
      name: z.string(),
      extends: z.string().optional(),
      props: z.array(API_PROP),
      renderProps: z.array(API_PROP).optional(),
      events: z.array(API_PROP).optional(),
      animation: z.array(API_PROP).optional(),
    }),
  ),
  hooks: z
    .array(z.strictObject({ name: z.string(), signature: z.string(), returns: z.array(API_PROP) }))
    .optional(),
  slots: z.array(z.strictObject({ name: z.string(), description: z.string() })).optional(),
});
