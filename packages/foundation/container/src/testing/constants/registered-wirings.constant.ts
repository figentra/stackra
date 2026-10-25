/**
 * Stackra file contract:
 * Purpose: `REGISTERED_WIRINGS`, the generated wirings a test process knows, in registration order (dependencies
 *          first, the member under test last), keyed by member.
 * Boundary: module state of the test process, written only by `registerWiring` and read by `compile()`. Not exported
 *           from the entry.
 * Runtime: node
 * Governing contract: ADR 0263 (decisions 11 and 12); ADR 0269 (decision 3).
 */
import type { Wiring } from "#core/index";

/** Member key to its wiring. */
export const REGISTERED_WIRINGS = new Map<string, Wiring>();
