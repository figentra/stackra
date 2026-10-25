/**
 * Stackra file contract:
 * Purpose: `TraceAttributes`, the attributes a span carries: the Stackra field dictionary of ADR 0147 decision 3
 *          (`requestId`, `tenantId`, `actorType`, `action`, `outcome`, `latencyMs`, ...), ids and codes only.
 * Boundary: a type only. Values are strings, numbers or booleans: never a payload, an input or a person's data
 *           (ADR 0184 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0147 (decision 3: span attributes carry no values); ADR 0184 (decisions 1 and 5).
 */

/** Span attributes by name. */
export type TraceAttributes = Readonly<Record<string, string | number | boolean>>;
