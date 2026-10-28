/**
 * Stackra file contract:
 * Purpose: `BASE_PACK_SCHEMAS`, the section schemas of the base-pack keys Stackra packages and OS services read, for
 *          `PackSchemaRegistry.create`: a notification category's channel chain (`notifications.channels.<category>`),
 *          whether prayer-time holds default on (`notifications.prayer_holds`), a capability's provider list
 *          (`providers.<capability>`, read by @stackra/integrations), the fallback text encoding of an imported
 *          file (`imports.legacy_encoding`), a Market's identity documents and address rules
 *          (`identity.national_ids`, `identity.address_format`, the JSON Schema of @stackra/validation's
 *          `NationalIdFormats$` and `AddressFormat$`) and the AI approval floor (`ai.approval_floor`, the
 *          `ApprovalFloor` @stackra/rules' `packApprovalFloorOf` reads).
 * Boundary: shapes only, never a market's value: the channels, providers and encodings a market uses are pack data.
 *           Each prefix is as narrow as its keys, so the OS service that owns a section can still register its other
 *           keys under their own prefix. Channel and provider codes are lowercase codes, not a closed list: the reader
 *           drops a code it does not serve. A provider entry is a code or `{ provider, status }`, as
 *           `MarketPackProviderDefaultsDriver` reads it. The encoding is a WHATWG label (`windows-1256`). The identity
 *           shapes come from their owner's `X$` (a pattern's regex check is code, not JSON Schema, so it stays in
 *           `X$`); the approval floor is written here, since @stackra/rules imports this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0417 (X2-19: the section schema registry); ADR 0370; ADR 0422 (decision 3); OS notifications
 *                     SPEC (OS-185, OS-197); OS data-exchange SPEC (OS-162); STA-1252; ADR 0405 and STA-1269 (identity
 *                     formats); ADR 0398 decision 3 and STA-1250 (the pack approval floor); STA-1301.
 */
import { AddressFormat$, NationalIdFormats$ } from "@stackra/validation";
import { z } from "zod";

import type { PackKeySchema } from "#core/types/pack-key-schema.type";
import type { PackSchema } from "#core/types/pack-schema.type";

/** The plain JSON Schema of `schema`, without zod's own members. */
const jsonSchemaOf = (schema: z.ZodType): PackKeySchema["schema"] =>
  // oxlint-disable-next-line unicorn/prefer-structured-clone -- a JSON round trip on purpose: it is what the wire does (Dates become strings, undefined and functions drop)
  JSON.parse(JSON.stringify(z.toJSONSchema(schema))) as PackKeySchema["schema"];

/** A list of non-empty strings. */
const TEXTS = { type: "array", items: { type: "string", minLength: 1 } } as const;

/** A lowercase code (`in_app`, `unifonic`). */
const CODE = { type: "string", pattern: "^[a-z][a-z0-9_]*$" } as const;

/** The base-pack section schemas this package ships. */
export const BASE_PACK_SCHEMAS: readonly PackSchema[] = [
  {
    prefix: "notifications.channels",
    owner: "os",
    keys: [
      {
        key: "notifications.channels.*",
        schema: { type: "array", items: CODE, minItems: 1 },
      },
    ],
  },
  {
    prefix: "notifications.prayer_holds",
    owner: "os",
    keys: [{ key: "notifications.prayer_holds", schema: { type: "boolean" } }],
  },
  {
    prefix: "providers",
    owner: "os",
    keys: [
      {
        key: "providers.*",
        schema: {
          type: "array",
          items: {
            anyOf: [
              CODE,
              {
                type: "object",
                properties: { provider: CODE, status: CODE },
                required: ["provider"],
                additionalProperties: false,
              },
            ],
          },
        },
      },
    ],
  },
  {
    prefix: "imports.legacy_encoding",
    owner: "os",
    keys: [
      {
        key: "imports.legacy_encoding",
        schema: { type: "string", pattern: "^[a-z0-9][a-z0-9_.:-]*$", maxLength: 32 },
      },
    ],
  },
  {
    prefix: "identity.national_ids",
    owner: "os",
    keys: [{ key: "identity.national_ids", schema: jsonSchemaOf(NationalIdFormats$) }],
  },
  {
    prefix: "identity.address_format",
    owner: "os",
    keys: [{ key: "identity.address_format", schema: jsonSchemaOf(AddressFormat$) }],
  },
  {
    prefix: "ai.approval_floor",
    owner: "os",
    keys: [
      {
        key: "ai.approval_floor",
        schema: {
          type: "object",
          properties: {
            tags: TEXTS,
            tagSets: { type: "array", items: { ...TEXTS, minItems: 1 } },
            recipientLimit: { type: "integer", minimum: 0 },
            deletes: { type: "boolean" },
            actions: TEXTS,
          },
          additionalProperties: false,
        },
      },
    ],
  },
];
