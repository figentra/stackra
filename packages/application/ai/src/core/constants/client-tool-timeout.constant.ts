/**
 * Stackra file contract:
 * Purpose: `CLIENT_TOOL_TIMEOUT_MS`, how long a run waits for the viewer's screen to answer a client tool call before
 *          the model is told `client_unavailable`.
 * Boundary: the platform's 30 seconds (ADR 0490 decision 4). The runtime reads it; a caller that needs another window
 *           passes `clientToolTimeoutMs` in the call.
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decision 4); STA-1631.
 */

/** The wait for a client tool answer, in milliseconds. */
export const CLIENT_TOOL_TIMEOUT_MS = 30_000;
