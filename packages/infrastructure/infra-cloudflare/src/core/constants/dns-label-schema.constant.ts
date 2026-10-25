/**
 * Stackra file contract:
 * Purpose: `DNS_LABEL_SCHEMA`, one DNS label: lower-case letters, digits and inner hyphens, at most 63 characters. A
 *          dev name on the dev zone is one such label, so Universal SSL covers it.
 * Boundary: internal; the edge and stack schemas and `tunnelIngress` compose it.
 * Runtime: isomorphic
 * Governing contract: ADR 0290 (decision 2: one label deep on the dev zone).
 */
import { z } from "zod";

/** `api`, `console-akouta`, `turbo-cache`. */
export const DNS_LABEL_SCHEMA = z
  .string()
  .regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/, "Expected one DNS label (a-z, 0-9, inner -)");
