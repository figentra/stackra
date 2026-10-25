/**
 * Stackra file contract:
 * Purpose: `ParsedDocumentTemplate`, a print template after `parseDocumentTemplate`: checked, with every default
 *          filled in.
 * Boundary: a type only, inferred from `DOCUMENT_TEMPLATE_SCHEMA`'s output.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 1).
 */
import type { z } from "zod";

import type { DOCUMENT_TEMPLATE_SCHEMA } from "#core/constants/document-template-schema.constant";

/** A checked print template. */
export type ParsedDocumentTemplate = z.output<typeof DOCUMENT_TEMPLATE_SCHEMA>;
