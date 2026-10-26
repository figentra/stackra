/**
 * Stackra file contract:
 * Purpose: `BRAND_KIT_SCHEMA`, the JSON Schema of `kit.json` that `parseKit` checks with `validateJsonSchema`: the
 *          required id, names, theme and symbol, and the shape of each optional block (`KIT_DEFAULTS` fills what is
 *          left out).
 * Boundary: data only, in the subset `validateJsonSchema` reads. The top level takes unknown fields, because a kit's
 *           owner keeps its own data there (a parent kit, endorsement rules) that this package never reads; every
 *           block this package reads is closed.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decisions 4 and 5).
 */
import { ColorRole } from "@stackra/tokens/contracts";

/** A kit-relative path: no leading slash, no `..` segment. */
const KIT_PATH = { type: "string", minLength: 1, pattern: "^(?!/)(?!.*(^|/)\\.\\.(/|$)).+$" };

/** A share from 0 to 1. */
const SHARE = { type: "number", minimum: 0, maximum: 1 };

/** A pixel size. */
const PIXELS = { type: "integer", minimum: 16, maximum: 8192 };

/** The schema. */
export const BRAND_KIT_SCHEMA = {
  type: "object",
  required: ["id", "name", "theme", "symbol"],
  properties: {
    id: { type: "string", pattern: "^[a-z][a-z0-9]*(-[a-z0-9]+)*$" },
    name: {
      type: "object",
      required: ["en"],
      propertyNames: { type: "string", pattern: "^[a-z]{2,3}(-[A-Z]{2})?$" },
      additionalProperties: { type: "string", minLength: 1 },
    },
    shortName: { type: "string", minLength: 1 },
    theme: { $ref: "#/$defs/path" },
    symbol: { $ref: "#/$defs/path" },
    icon: {
      type: "object",
      additionalProperties: false,
      properties: {
        background: { $ref: "#/$defs/role" },
        foreground: { $ref: "#/$defs/role" },
        scale: { $ref: "#/$defs/share" },
        radius: { type: "number", minimum: 0, maximum: 0.5 },
        sizes: { type: "array", minItems: 1, items: { $ref: "#/$defs/pixels" } },
      },
    },
    splash: {
      type: "object",
      additionalProperties: false,
      properties: {
        background: { $ref: "#/$defs/role" },
        foreground: { $ref: "#/$defs/role" },
        scale: { $ref: "#/$defs/share" },
        size: { $ref: "#/$defs/pixels" },
      },
    },
    manifest: {
      type: "object",
      additionalProperties: false,
      properties: {
        display: { enum: ["fullscreen", "standalone", "minimal-ui", "browser"] },
        startUrl: { type: "string", minLength: 1 },
      },
    },
    store: {
      type: "object",
      additionalProperties: false,
      properties: {
        background: { $ref: "#/$defs/role" },
        foreground: { $ref: "#/$defs/role" },
        captionSize: { type: "number", minimum: 0.01, maximum: 0.2 },
        frames: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["id", "width", "height"],
            additionalProperties: false,
            properties: {
              id: { type: "string", pattern: "^[a-z0-9][a-z0-9.-]*$" },
              width: { $ref: "#/$defs/pixels" },
              height: { $ref: "#/$defs/pixels" },
            },
          },
        },
        fonts: { type: "object", additionalProperties: { $ref: "#/$defs/path" } },
      },
    },
    check: {
      type: "object",
      additionalProperties: false,
      properties: {
        requiredFiles: { type: "array", items: { $ref: "#/$defs/path" } },
        requiredMarks: { type: "array", items: { type: "string", minLength: 1 } },
      },
    },
  },
  $defs: {
    path: KIT_PATH,
    share: SHARE,
    pixels: PIXELS,
    role: { enum: [...ColorRole] },
  },
} as const;
