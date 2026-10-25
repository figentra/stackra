/**
 * Stackra file contract:
 * Purpose: `MemoryNotifier`, the type a test casts the bound `Notifier` to under the memory drivers, to read what was
 *          sent: `(app.get(Notifier) as MemoryNotifier).sent(OrderReceiptNotification)`.
 * Boundary: type only: the memory driver itself is exported from `.` (gen's wiring imports it there), so this entry
 *           names its type without exporting the class twice (ADR 0294 decision 15).
 * Runtime: node
 * Governing contract: ADR 0266 (decision 2: memory driver and fake); ADR 0269 (decision 3).
 */
import type { MemoryNotifierDriver } from "#core/index";

/** The memory `Notifier` driver, as a test reads it. */
export type MemoryNotifier = MemoryNotifierDriver;
