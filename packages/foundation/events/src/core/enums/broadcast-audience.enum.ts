/**
 * Stackra file contract:
 * Purpose: `BroadcastAudience`, who receives the data-free refresh an integration event broadcasts: the principal's
 *          own sessions or every session of the tenant, each only with the broadcast's permission.
 * Boundary: codes only; `@stackra/realtime` derives the channel (`principal.{principalId}.<module>` or
 *           `tenant.{tenantId}.<module>`) and enforces the permission at delivery.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (amendment item 7: broadcast has an audience, default principal); ADR 0225 (2026-10-23
 *                     note).
 */
import { Enum } from "@stackra/contracts";

/** The two broadcast audiences. */
export const BroadcastAudience = Enum.of({
  /** Only the sessions of the principal the event is about; the default. */
  Principal: "principal",
  /** Every session of the tenant that holds the permission. */
  Tenant: "tenant",
});

/** One of the codes above. */
export type BroadcastAudience = Enum.Value<typeof BroadcastAudience>;
