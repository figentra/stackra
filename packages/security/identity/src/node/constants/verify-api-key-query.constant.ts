/**
 * Stackra file contract:
 * Purpose: `VERIFY_API_KEY_QUERY`, the descriptor of the identity service's `principals.api_key.verify@1` (`GET
 *          /api-keys/verify`): the gateway's read of a presented key by its SHA-256, answered with the key's record.
 * Boundary: internal to `./node`; the same descriptor gen writes into a host's `#stackra/clients/identity`, which this
 *           package cannot import. The answer's `keyId`, `scopes`, `mode` and `versionPin` are optional so an identity
 *           service that does not answer them yet still parses; a record without a mode is then refused by the verifier.
 * Runtime: node
 * Governing contract: ADR 0260 (decisions 3, 4 and 6); ADR 0278 (amendments of 2026-11-09); STA-2646.
 */
import { remoteQuery } from "@stackra/clients";
import { HttpMethod } from "@stackra/contracts";
import { publicId } from "@stackra/validation";
import { z } from "zod";

import { ApiKeyMode } from "#contracts/enums/api-key-mode.enum";

/**
 * The remote query `principals.api_key.verify@1`.
 * @example
 * readonly verify = this.member(VERIFY_API_KEY_QUERY);
 */
export const VERIFY_API_KEY_QUERY = remoteQuery("principals.api_key.verify@1", {
  input: z.object({ keyHash: z.string().regex(/^[0-9a-f]{64}$/) }),
  output: z.object({
    keyId: publicId("aki").optional(),
    principalId: publicId("prn"),
    scopeId: publicId("scp"),
    keyKind: z.enum(["secret", "publishable"]),
    origins: z.array(z.string()).default([]),
    scopes: z.array(z.string()).optional(),
    mode: z.enum([ApiKeyMode.Test, ApiKeyMode.Live]).optional(),
    versionPin: z.string().optional(),
  }),
  endpoint: { method: HttpMethod.Get, path: "/api-keys/verify" },
});
