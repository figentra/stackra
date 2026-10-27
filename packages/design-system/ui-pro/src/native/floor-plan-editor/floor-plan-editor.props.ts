/**
 * Stackra file contract:
 * Purpose: `FloorPlanEditorProps`, props of the native FloorPlanEditor.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3).
 */
import type { FloorPlanEditorContractProps } from "#contracts/types/floor-plan-editor-contract-props.type";

/** Props of the native FloorPlanEditor. */
export type FloorPlanEditorProps = FloorPlanEditorContractProps;
