/**
 * Stackra file contract:
 * Purpose: `ClientResultInput`, the input of `ai.run.client_result` (`PUT /runs/:runId/client-result`): the run, the
 *          tool call it answers, and either the screen's result or a refusal code.
 * Boundary: a shape class; it registers this package's own schema for itself when the module loads. The action that
 *           takes it is the OS ai service's wrapper over `AgentRuntime.resolveClientTool`; it is idempotent by
 *           `toolCallId` (ADR 0490 decision 4). Exactly one of `result` and `refusal` is sent.
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decision 4); ADR 0305 (one declaration per file); STA-1631.
 */
import type { PublicId } from "@stackra/contracts";
import { registerSchemas, Schema } from "@stackra/validation";

import { CLIENT_RESULT_INPUT_SCHEMA } from "#core/constants/client-result-input-schema.constant";
import type { ClientToolResult } from "#core/schemas/client-tool-result.schema";

/**
 * A surface's answer to one client tool call.
 *
 * @example
 * ClientResultInput.create({ runId, toolCallId: "call_1", result: { done: true } });
 */
export class ClientResultInput extends Schema {
  /** The run that is waiting. */
  runId!: PublicId<"airun">;

  /** The tool call it answers. */
  toolCallId!: string;

  /** What the screen did; absent when it refused. */
  result?: ClientToolResult;

  /** The code the surface refuses with; absent when it answered. */
  refusal?: string;
}

registerSchemas([[ClientResultInput, CLIENT_RESULT_INPUT_SCHEMA]]);
