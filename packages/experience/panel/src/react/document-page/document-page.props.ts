/**
 * Stackra file contract:
 * Purpose: `DocumentPageProps`, what `DocumentPage` takes: the `Document({ ... })` class and its route constant.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12: `<name>.props.ts`); ADR 0307 (rule 20).
 */
import type { AnyClass } from "@stackra/container";

import type { DocumentRoute } from "#core/types/document-route.type";

/** The props of a document page. */
export interface DocumentPageProps {
  /** The `Document({ kind, blocks })` class. */
  readonly document: AnyClass;

  /** Its route constant; its key names the title (`<module>::documents.<name>.title`). */
  readonly route: DocumentRoute;
}
