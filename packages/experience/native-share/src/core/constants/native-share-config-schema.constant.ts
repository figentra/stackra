/**
 * Stackra file contract:
 * Purpose: `NATIVE_SHARE_CONFIG_SCHEMA`, the zod schema this package ships for `NativeShareConfig` (exported as
 *          `NativeShareConfig$`): whether text and links are taken, which file types, how many items and how large a
 *          file may be, and how long a text.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults: text, one link, photos and PDFs, up to ten items of 25 MB. The config plugin parses its
 *           props with it too, so the share sheet and the driver accept the same things. Nothing here is a secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0478 (decision 2).
 */
import { z } from "zod";

// shortcut: authored until gen compiles this package's NativeShareOptions into #stackra/schemas; replace with STA-339.
/** The shipped `NativeShareConfig$`. */
export const NATIVE_SHARE_CONFIG_SCHEMA = z.object({
  text: z.boolean().default(true),
  links: z.boolean().default(true),
  fileTypes: z
    .array(z.string().regex(/^[a-z]+\/(?:\*|[\w.+-]+)$/))
    .default(() => ["image/*", "application/pdf"]),
  maxItems: z.int().min(1).max(100).default(10),
  maxBytes: z.int().min(1).default(25_000_000),
  maxTextLength: z.int().min(1).default(10_000),
});
