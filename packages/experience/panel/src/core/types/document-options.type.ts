/**
 * Stackra file contract:
 * Purpose: `DocumentOptions`, what `Document({ ... })` takes: the kind, the path, the area, the navigation entry, the layout
 *          of a Page, the range picker of a Dashboard and the blocks.
 * Boundary: a type only. A Dashboard places widget blocks only and has no layout; a Page has no range picker.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 20); ADR 0110; ADR 0154; ADR 0294 (decision 16: `Document({ kind, path, blocks })`).
 */
import type { ApiArea } from "@stackra/contracts";

import type { DocumentKind } from "#core/enums/document-kind.enum";
import type { DocumentLayout } from "#core/enums/document-layout.enum";
import type { BlockNode } from "#core/types/block-node.type";
import type { DocumentRange } from "#core/types/document-range.type";
import type { PanelNavigation } from "#core/types/panel-navigation.type";

/** The options of a document. */
export interface DocumentOptions {
  /** A Page or a Dashboard. */
  readonly kind: DocumentKind;

  /** The path inside the hosting panel; absent for a document a route mounts. */
  readonly path?: string;

  /** The API area whose panel hosts it; the app's own when absent. */
  readonly area?: ApiArea;

  /** Its navigation entry. */
  readonly navigation?: PanelNavigation;

  /** A Page's layout. */
  readonly layout?: DocumentLayout;

  /** A Dashboard's range picker. */
  readonly range?: DocumentRange;

  /** The blocks in order. */
  readonly blocks: readonly BlockNode[];
}
