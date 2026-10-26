/**
 * Stackra file contract:
 * Purpose: `FileTreeProps`, props of the web FileTree: the shared contract plus HeroUI Pro's own tree props, with
 *          `aria-label` renamed `label` and `reduceMotion` renamed `isMotionReduced`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { FileTreeRootProps } from "@heroui-pro/react/file-tree";

import type { FileTreeContractProps } from "#contracts/types/file-tree-contract-props.type";

/**
 * Props of the web FileTree: the shared contract plus HeroUI Pro's own tree props, with `aria-label` renamed `label`
 * and `reduceMotion` renamed `isMotionReduced`.
 */
export type FileTreeProps<T extends object> = FileTreeContractProps &
  Omit<FileTreeRootProps<T>, keyof FileTreeContractProps | "aria-label" | "reduceMotion">;
