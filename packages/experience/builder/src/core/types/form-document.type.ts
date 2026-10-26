/**
 * Stackra file contract:
 * Purpose: `FormDocument`, a parsed form document: its key, version, label, submit action and steps.
 * Boundary: a type only, inferred from `FormDocument$` so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0426 (decision 1).
 */
import type { z } from "zod";

import type { FORM_DOCUMENT_SCHEMA } from "#core/constants/form-document-schema.constant";

/** A parsed form document. */
export type FormDocument = z.output<typeof FORM_DOCUMENT_SCHEMA>;
