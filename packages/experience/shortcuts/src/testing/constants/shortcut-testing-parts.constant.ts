/**
 * Stackra file contract:
 * Purpose: `SHORTCUT_TESTING_PARTS`, the registered testing parts by name, in registration order.
 * Boundary: test-process state written only by `registerShortcutTestingPart`; read by `runShortcut`.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import type { ShortcutTestingPart } from "#testing/types/shortcut-testing-part.type";

/** The registered testing parts. */
export const SHORTCUT_TESTING_PARTS = new Map<string, ShortcutTestingPart>();
