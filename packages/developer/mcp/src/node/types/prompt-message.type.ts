/**
 * Stackra file contract:
 * Purpose: `PromptMessage`, one message of a `prompts/get` result: a user message holding either text or an embedded
 *          resource (a manifest or a skill the recipe needs).
 * Boundary: type only; `getLocalPrompt` builds it.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); the MCP `PromptMessage` shape; STA-2919.
 */
import type { ResourceContents } from "#node/types/resource-contents.type";

/** A message of a local prompt. */
export type PromptMessage = {
  /** Always `user`: the recipe is the user's request to the assistant. */
  readonly role: "user";
  /** The recipe text, or a resource it attaches. */
  readonly content:
    | { readonly type: "text"; readonly text: string }
    | { readonly type: "resource"; readonly resource: ResourceContents };
};
