/**
 * Stackra file contract:
 * Purpose: `linkAuditEntry`, the next link of an audit chain: the `AuditEntry` of @stackra/actions flattened to an
 *          `AuditRecord`, with the sequence after `previous`, the hash of `previous` and its own hash.
 * Boundary: a pure function over Web Crypto; it reads no store, so the driver that calls it owns the head it passes.
 *           The first link of a chain follows 64 zeros. Absent optional fields become `null`, so the row and the hash
 *           agree.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3: a hash chain per tenant); ADR 0136 (decision 5); ADR 0465 (decision 4).
 */
import type { AuditEntry } from "@stackra/actions/contracts";

import type { AuditLink } from "#contracts/types/audit-link.type";
import type { AuditRecord } from "#contracts/types/audit-record.type";
import { hashAuditLink } from "#core/functions/hash-audit-link.function";

/** The `previousHash` of a chain's first link. */
const GENESIS_HASH = "0".repeat(64);

/**
 * Chains `entry` after `previous`, or starts a chain.
 *
 * @param entry - the pipeline's audit entry.
 * @param previous - the chain's newest link; absent for a new chain.
 * @returns the link to store.
 * @example
 * const link = await linkAuditEntry(entry, head ?? undefined);
 */
export async function linkAuditEntry(
  entry: AuditEntry,
  previous?: Pick<AuditLink, "sequence" | "hash">,
): Promise<AuditLink> {
  const { call } = entry;
  const record: AuditRecord = {
    callId: call.callId,
    key: call.key,
    permission: call.permission ?? null,
    risk: call.risk ?? null,
    effects: [...(call.effects ?? [])],
    actor: call.actor,
    scopeId: call.scope?.id ?? null,
    scopePath: call.scope?.path ?? null,
    originKind: call.origin?.kind ?? null,
    originId: call.origin?.id ?? null,
    outcome: entry.outcome,
    code: entry.code ?? null,
    fields: { ...entry.fields },
    at: entry.at,
  };
  const sequence = (previous?.sequence ?? 0) + 1;
  const previousHash = previous?.hash ?? GENESIS_HASH;
  return {
    ...record,
    sequence,
    previousHash,
    hash: await hashAuditLink(record, sequence, previousHash),
  };
}
