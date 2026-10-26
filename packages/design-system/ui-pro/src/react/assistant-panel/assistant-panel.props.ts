/**
 * Stackra file contract:
 * Purpose: `AssistantPanelProps`, props of the web AssistantPanel.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0360 (decisions 1 and 11); ADR 0310 (decision 3).
 */
import type { AssistantPanelContractProps } from "#contracts/types/assistant-panel-contract-props.type";

/** Props of the web AssistantPanel. */
export type AssistantPanelProps = AssistantPanelContractProps;
