/**
 * Stackra file contract:
 * Purpose: the props every runtime's `OverflowList` takes: the items drawn as chips, how many show before the rest
 *          fold into a "+N more" button, the list's accessible name, and the chips' size and tone. Each runtime's
 *          `OverflowListProps` is this plus its root element's own props, which pass through unchanged.
 * Boundary: types only. The list holds only whether it is expanded; the items are the caller's. The words of the
 *           "+N more" and "Show less" buttons come from the `ui` catalogue in the active locale.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); design-system gap
 *          inventory (2026-10-28) row 24.
 */
import type { Tone } from "@stackra/contracts";
import type { Size } from "#contracts/enums/size.enum";
import type { TagItem } from "#contracts/types/tag-item.type";

/** Props shared by the web and native `OverflowList`. */
export interface OverflowListContractProps {
  /** The items, in order; each is drawn as a chip with its `label`, which truncates past the chip's width. */
  readonly items: readonly TagItem[];
  /** How many chips show while the list is folded; the rest become one "+N more" button. Defaults to 3. */
  readonly maxVisible?: number | undefined;
  /** The accessible name of the list, for example "Product tags". */
  readonly label: string;
  /** True to start expanded. Defaults to false. */
  readonly defaultExpanded?: boolean | undefined;
  /** The chips' size. Defaults to `sm`. */
  readonly size?: Size | undefined;
  /** The chips' colour role. Defaults to `default`. */
  readonly tone?: Tone | undefined;
}
