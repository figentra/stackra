/**
 * Stackra file contract:
 * Purpose: `TaskTrayProps`, the props of the web `TaskTray`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { TaskTrayContractProps } from "#contracts/types/task-tray-contract-props.type";

/** Props of the web TaskTray. */
export type TaskTrayProps = TaskTrayContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
