/**
 * Stackra file contract:
 * Purpose: `TenantDataKeyMinted`, recorded when a tenant's data key is minted: its first key on its first seal, or a
 *          rotation's next key (ADR 0188, amendment 2026-11-09). The audit trail lists it beside the tenant.
 * Boundary: a domain event, recorded on the new key's row by the Postgres store and dispatched in process after the
 *           mint commits. It carries the tenant and the key id only: never the key, the wrapped ciphertext or the KMS
 *           key. It registers its own schema when the module loads.
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (decision 2 and its 2026-11-09 amendment); ADR 0134 (audit); ADR 0305 (rules 19 and 21).
 */
import type { PublicId } from "@stackra/contracts";
import { DomainEvent } from "@stackra/events";
import { publicId, registerSchemas } from "@stackra/validation";
import { z } from "zod";

/**
 * One minted data key.
 * @example
 * row.record(TenantDataKeyMinted.create({ tenantId, keyId: "k2" }));
 */
export class TenantDataKeyMinted extends DomainEvent {
  /** The tenant the key belongs to. */
  tenantId!: PublicId<"scp">;

  /** The new key's id (`k1`, `k2`, …), which data sealed under it names. */
  keyId!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    TenantDataKeyMinted,
    z.object({ tenantId: publicId("scp"), keyId: z.string().regex(/^k[1-9][0-9]{0,8}$/) }),
  ],
]);
