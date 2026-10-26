/**
 * Stackra file contract:
 * Purpose: `BASE_PACK_SCHEMAS`, the section schemas of the base-pack keys Stackra packages and OS services read, for
 *          `PackSchemaRegistry.create`: a notification category's channel chain (`notifications.channels.<category>`),
 *          whether prayer-time holds default on (`notifications.prayer_holds`), a capability's provider list
 *          (`providers.<capability>`, read by @stackra/integrations) and the fallback text encoding of an imported
 *          file (`imports.legacy_encoding`).
 * Boundary: shapes only, never a market's value: the channels, providers and encodings a market uses are pack data.
 *           Each prefix is as narrow as its keys, so the OS service that owns a section can still register its other
 *           keys under their own prefix. Channel and provider codes are lowercase codes, not a closed list: the reader
 *           drops a code it does not serve. A provider entry is a code or `{ provider, status }`, as
 *           `MarketPackProviderDefaultsDriver` reads it. The encoding is a WHATWG label (`windows-1256`).
 * Runtime: isomorphic
 * Governing contract: ADR 0417 (X2-19: the section schema registry); ADR 0370; ADR 0422 (decision 3); OS notifications
 *                     SPEC (OS-185, OS-197); OS data-exchange SPEC (OS-162); STA-1252.
 */
import type { PackSchema } from "#core/types/pack-schema.type";

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
];
