/**
 * Stackra file contract:
 * Purpose: `SHORTCUT_ENTRIES`, the registered shortcuts by class, in registration order: what the palette lists and
 *          the keyboard bindings bind.
 * Boundary: process state written only by `registerShortcuts`; read by `./react` and the tests.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22); registry v3.1 gen-core needs (item 4, the wiring).
 */
import type { AnyClass } from "@stackra/container";

import type { RunnableShortcut } from "#core/types/runnable-shortcut.type";
import type { ShortcutEntry } from "#core/types/shortcut-entry.type";

/** The registered shortcuts. */
export const SHORTCUT_ENTRIES = new Map<AnyClass<RunnableShortcut>, ShortcutEntry>();
