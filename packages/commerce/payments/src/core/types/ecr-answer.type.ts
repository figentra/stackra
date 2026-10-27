/**
 * Stackra file contract:
 * Purpose: `EcrAnswer`, a terminal's answer read into its named fields (blank positions left out).
 * Boundary: internal to the ECR terminal gateway; not exported from an entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0377 (decisions 1 and 9).
 */
import type { EcrResponseField } from "#contracts/types/ecr-response-field.type";

/** An answer's fields by name. */
export type EcrAnswer = Readonly<Partial<Record<Exclude<EcrResponseField, "blank">, string>>>;
