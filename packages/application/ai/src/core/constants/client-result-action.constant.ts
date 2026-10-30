/**
 * Stackra file contract:
 * Purpose: `CLIENT_RESULT_ACTION`, the contract of the action that carries a surface's answer to a client tool call:
 *          its key, HTTP method and path.
 * Boundary: data only. The action itself is the OS ai service's, a thin wrapper that calls
 *           `AgentRuntime.resolveClientTool`; being an action it gets idempotency (by `toolCallId`) and audit for
 *           free. This package names the contract so the SDK and the service agree on it (ADR 0490 decision 4).
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decision 4); ADR 0098; STA-1631.
 */

/** `ai.run.client_result`: `PUT /runs/:runId/client-result`, input `ClientResultInput`. */
export const CLIENT_RESULT_ACTION = Object.freeze({
  /** The action key the service's wrapper declares (`ai.run.client_result@1` once locked). */
  key: "ai.run.client_result",
  /** The HTTP method. */
  method: "PUT",
  /** The route, from the key by the endpoint convention. */
  path: "/runs/:runId/client-result",
} as const);
