/**
 * Stackra file contract:
 * Purpose: `BRIDGE_CHANNEL`, the one IPC channel every bridge call travels on: the generated preload invokes it with
 *          the bridge's class name and its input, and the desktop app's handler answers.
 * Boundary: a constant; the allow-list is the set of `bridge` bindings in the main-process wiring (ADR 0251 decision 2).
 * Runtime: node
 * Governing contract: ADR 0251 (decisions 1 to 3).
 */

/** The IPC channel of bridge calls. */
export const BRIDGE_CHANNEL = "stackra:bridge";
