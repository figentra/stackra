/**
 * Stackra file contract:
 * Purpose: `DocTabsProps`: props of `DocTabs`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */
import type { ReactNode } from "react";

import type { DocPage } from "#src/components/doc-screen/doc-page.type";

/** Props of {@link DocTabs}. */
export interface DocTabsProps {
  /** The pages in order: the id, the tab label and the page content. */
  readonly pages: readonly {
    readonly id: DocPage;
    readonly label: string;
    readonly content: ReactNode;
  }[];
  /** The page on screen (controlled). */
  readonly page: DocPage;
  /** Called with the page the user tapped to. */
  readonly onPageChange: (page: DocPage) => void;
  /** The spoken name of the tab list. */
  readonly label: string;
}
