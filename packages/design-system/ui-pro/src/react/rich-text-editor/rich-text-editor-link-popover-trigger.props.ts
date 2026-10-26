/**
 * Stackra file contract:
 * Purpose: `RichTextEditorLinkPopoverTriggerProps`, props of the link popover's trigger: the shared contract plus
 *          HeroUI's button props, with `aria-label` as `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import type { Button } from "@heroui/react";
import type { ComponentProps } from "react";

import type { RichTextEditorLinkPopoverTriggerContractProps } from "#contracts/types/rich-text-editor-link-popover-trigger-contract-props.type";

/** Props of the link popover's trigger: the shared contract plus HeroUI's button props, with `aria-label` as `label`. */
export type RichTextEditorLinkPopoverTriggerProps = RichTextEditorLinkPopoverTriggerContractProps &
  Omit<
    ComponentProps<typeof Button>,
    keyof RichTextEditorLinkPopoverTriggerContractProps | "aria-label" | "className"
  > & {
    /** Classes added to HeroUI Pro's own. */
    readonly className?: string | undefined;
  };
