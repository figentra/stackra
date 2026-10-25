/**
 * Stackra file contract:
 * Purpose: `registerSequences`, how gen's generated entry tells `SequenceService` the key it derived and locked for each
 *          sequence class (`billing.invoice` for `InvoiceSequence` in the billing module).
 * Boundary: writes the process-wide registry; a later row for the same class replaces the earlier one. Checks each row,
 *           so a wrong row fails at boot rather than on the first number: the class must be a sequence and no two
 *           classes may share a key, since they would share counters.
 * Runtime: node
 * Governing contract: ADR 0342 (decisions 1 and 5); ADR 0294 (decisions 10, 20 and 22); the `registerEntitlements`
 *                     precedent.
 */
import { kindOf } from "@stackra/container";

import { SEQUENCE_REGISTRY } from "#core/constants/sequence-registry.constant";
import type { SequenceRegistration } from "#core/types/sequence-registration.type";

/** A locked key: `<module>.<key>`, snake_case words joined by dots. */
const LOCKED_KEY = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/;

/**
 * Registers the locked keys of sequences.
 *
 * @throws TypeError when a row's class is not a sequence, its key is not `<module>.<key>`, or another class has it.
 * @example
 * registerSequences([{ type: InvoiceSequence, key: "billing.invoice" }]);
 */
export function registerSequences(rows: readonly SequenceRegistration[]): void {
  for (const row of rows) {
    if (kindOf(row.type)?.kind !== "sequence")
      throw new TypeError(`registerSequences: ${row.type.name} is not a sequence`);
    if (typeof row.key !== "string" || !LOCKED_KEY.test(row.key))
      throw new TypeError(
        `registerSequences: ${row.type.name} needs its locked key, such as "billing.invoice", got ${JSON.stringify(row.key)}`,
      );
    for (const [type, known] of SEQUENCE_REGISTRY)
      if (type !== row.type && known.key === row.key)
        throw new TypeError(
          `registerSequences: ${row.type.name} and ${type.name} both have the key ${row.key}`,
        );
    SEQUENCE_REGISTRY.set(row.type, Object.freeze({ type: row.type, key: row.key }));
  }
}
