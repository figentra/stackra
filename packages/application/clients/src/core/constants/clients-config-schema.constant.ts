/**
 * Stackra file contract:
 * Purpose: `CLIENTS_CONFIG_SCHEMA`, the shipped schema of `ClientsOptions`: the API base URL, the pinned API version,
 *          the request timeout and the attempts per call, each with its safe default.
 * Boundary: authored until gen compiles `ClientsOptions` into `#stackra/schemas` (STA-339); exported as
 *           `ClientsConfig$`. The base URL is empty (same origin), an absolute `http(s)` URL or a path; a trailing
 *           slash is dropped when a route is joined to it.
 * Runtime: isomorphic
 * Governing contract: ADR 0146 (config classes); ADR 0118 (`Stackra-Version`); ADR 0140 (retryable kinds).
 */
import { z } from "zod";

// shortcut: authored until gen compiles this package's ClientsOptions into #stackra/schemas; replace with STA-339.
/** The shipped `ClientsConfig$`. */
export const CLIENTS_CONFIG_SCHEMA = z.object({
  baseUrl: z
    .string()
    .regex(/^(|https?:\/\/\S+|\/\S*)$/, "Expected empty, an http(s) URL or a path")
    .default(""),
  apiVersion: z
    .string()
    .regex(/^(|\d{4}-\d{2}-\d{2})$/, "Expected empty or a date (2027-03-01)")
    .default(""),
  timeoutSeconds: z.number().int().min(1).max(300).default(30),
  attempts: z.number().int().min(1).max(10).default(3),
});
