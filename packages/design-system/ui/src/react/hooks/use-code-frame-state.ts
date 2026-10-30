/**
 * Stackra file contract:
 * Purpose: `useCodeFrameState(props)`, the state every runtime's CodeBlock frame shares: the highlighted rows, the
 *          wrap toggle (starting at `isWrapped`), and the collapse of a long block: past `maxLines` (30 by default, 0
 *          for never) only the first rows show until the reader expands it, with the show-all or show-less words, and
 *          the digit count of the widest line number.
 * Boundary: a React hook with no rendering; the runtimes draw the rows, the header and the toggles. The web and native
 *           CodeBlock both use it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import { useMemo, useState } from "react";

import type { CodeBlockContractProps } from "#contracts/types/code-block-contract-props.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { codeRowsOf } from "#core/functions/code-rows-of.function";
import type { CodeRow } from "#core/types/code-row.type";
import { useUiText } from "#react/hooks/use-ui-text";

/**
 * The shared code frame state.
 * @param props - the code, its language, the diff and highlight settings, the starting wrap and the line limit
 * @returns the rows and the rows shown, the wrap and expand state and toggles, and the expand button's words
 */
export function useCodeFrameState({
  code = "",
  language,
  isDiff = false,
  highlightLines,
  isWrapped: isWrappedAtStart = false,
  maxLines = 30,
}: Pick<
  CodeBlockContractProps,
  "code" | "language" | "isDiff" | "highlightLines" | "isWrapped" | "maxLines"
>): {
  readonly rows: readonly CodeRow[];
  readonly shown: readonly CodeRow[];
  readonly isCollapsible: boolean;
  readonly isExpanded: boolean;
  readonly isWrapped: boolean;
  readonly toggleWrap: () => void;
  readonly toggleExpanded: () => void;
  readonly expandLabel: string;
  readonly numberDigits: number;
} {
  const t = useUiText();
  const [isWrapped, setWrapped] = useState(isWrappedAtStart);
  const [isExpanded, setExpanded] = useState(false);
  const rows = useMemo(
    () => codeRowsOf(code, { language, isDiff, highlightLines }),
    [code, language, isDiff, highlightLines],
  );
  const isCollapsible = maxLines > 0 && rows.length > maxLines;
  return {
    rows,
    shown: isCollapsible && !isExpanded ? rows.slice(0, maxLines) : rows,
    isCollapsible,
    isExpanded,
    isWrapped,
    toggleWrap: () => setWrapped((wrapped) => !wrapped),
    toggleExpanded: () => setExpanded((expanded) => !expanded),
    expandLabel: isExpanded
      ? t(UI_KEYS.ui.code_block.show_less)
      : t(UI_KEYS.ui.code_block.show_all, { count: rows.length }),
    numberDigits: String(rows.length).length,
  };
}
