/**
 * Stackra file contract:
 * Purpose: `RichTextContribution`, what a package adds to the web RichTextEditor without importing editor internals
 *          (ADR 0466 decision 3): TipTap extensions (nodes, marks, input rules, paste handlers), toolbar buttons (AI
 *          actions included) and a side panel, for the document kinds it names.
 * Boundary: types only; `@stackra/builder` collects contributions from modules and passes them in. Slash-menu and
 *           bubble-menu contributions arrive with the builder's document surface.
 * Runtime: browser
 * Governing contract: ADR 0466 (decisions 3, 4 and 7); ADR 0350 (UI slots); ADR 0305 (one declaration per file);
 *          STA-1371.
 */
import type { AnyExtension, Editor } from "@tiptap/core";
import type { ReactNode } from "react";

import type { RichTextToolbarItem } from "#react/rich-text-editor/rich-text-toolbar-item.type";

/** One package's additions to the editor. */
export interface RichTextContribution {
  /** A stable id, such as `ai.writing` or `seo.analysis`. */
  readonly id: string;
  /** The document kinds it applies to (`post`, `product_description`); without it, every kind. */
  readonly kinds?: readonly string[] | undefined;
  /** TipTap extensions: nodes, marks, input rules and paste handlers. A node brings its own serialisers. */
  readonly extensions?: readonly AnyExtension[] | undefined;
  /** Buttons added at the toolbar's end, after a separator. */
  readonly toolbar?: readonly RichTextToolbarItem[] | undefined;
  /** A side panel shown beside the text, such as SEO analysis; it re-renders as the document changes. */
  readonly panel?: ((editor: Editor) => ReactNode) | undefined;
}
