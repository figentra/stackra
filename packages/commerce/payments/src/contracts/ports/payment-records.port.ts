/**
 * Stackra file contract:
 * Purpose: `PaymentRecords`, the port of where the engine keeps its `PaymentRecord`s: one per merchant reference.
 * Boundary: an abstract class that is its own token, key `payments.PaymentRecords`. The `memory` driver ships here;
 *           the host binds a durable one (the payments service's table) with `@Replaces(PaymentRecords)`. A leaf
 *           file: it imports nothing outside src/contracts.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 15, 16 and 17); ADR 0263 (ports resolve by type); ADR 0357 (decision 6).
 */
import { Port } from "@stackra/contracts";

import type { PaymentRecord } from "#contracts/types/payment-record.type";

/**
 * The engine's payment state.
 *
 * @example
 * export class PostgresPaymentRecordsDriver extends Driver(PaymentRecords) { … }
 */
export abstract class PaymentRecords extends Port {
  /** Type-only port key, so `DriverName<PaymentRecords>` narrows to this port's drivers. */
  declare readonly "~key": "payments.PaymentRecords";

  /** The record under `reference`, or null. */
  abstract find(reference: string): Promise<PaymentRecord | null>;

  /** Writes `record`, replacing the one under the same reference. */
  abstract save(record: PaymentRecord): Promise<void>;
}
