/**
 * Stackra file contract:
 * Purpose: `EXTENSION_REGISTRY`, the slot-to-extension rows `registerExtensions` stored, in registration order.
 * Boundary: process-wide and internal: written by `registerExtensions`, read by every slot call. A row registered
 *           twice (same point, slot and class) is kept once.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 22 to 25).
 */
import type { ExtensionRegistration } from "#core/types/extension-registration.type";

/** Every registered extension row. */
export const EXTENSION_REGISTRY: ExtensionRegistration[] = [];
