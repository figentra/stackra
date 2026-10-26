/**
 * Stackra file contract:
 * Purpose: `AssistantPanelProps`, props of the native AssistantPanel.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0360 (decisions 1 and 11); ADR 0310 (decision 3); ADR 0303
 *                     (decision 7).
 */
import type { AssistantPanelContractProps } from "#contracts/types/assistant-panel-contract-props.type";

/** Props of the native AssistantPanel. */
export type AssistantPanelProps = AssistantPanelContractProps;
