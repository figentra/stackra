/**
 * Stackra file contract:
 * Purpose: `DocumentTemplate`, a print template as an author or the studio writes it (defaults may be left out).
 * Boundary: a type only, inferred from `DOCUMENT_TEMPLATE_SCHEMA`'s input; `parseDocumentTemplate` turns it into a
 *           `ParsedDocumentTemplate`.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 1).
 */
import type { z } from "zod";

import type { DOCUMENT_TEMPLATE_SCHEMA } from "#core/constants/document-template-schema.constant";

/** A print template before parsing. */
export type DocumentTemplate = z.input<typeof DOCUMENT_TEMPLATE_SCHEMA>;
