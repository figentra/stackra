/**
 * Stackra file contract:
 * Purpose: the EmojiPicker route of @figentra/playground: its path, title and category. The page it renders is
 *          `pro-emoji-picker.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0310 (decision 12); STA-416 FR-012.
 */
import { Route } from "@stackra/navigation";

import type { PageCategory } from "#src/enums/page-category.enum";

/** The `@stackra-pro/ui` EmojiPicker page, at `/pro-emoji-picker`. */
export class ProEmojiPickerRoute extends Route({ path: "/pro-emoji-picker" }) {
  /** The page title, the component's name. */
  static readonly title = "EmojiPicker";

  /** The category the page is listed under: the `@stackra-pro/ui` pages. */
  static readonly category: PageCategory = "Overlays";
}
