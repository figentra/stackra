/**
 * Stackra file contract:
 * Purpose: `ModuleExports`: the exports of one module, as `import.meta.glob` hands them over.
 * Boundary: a type only, in its own file (ADR 0305 rule 10).
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 10); ADR 0295 (decision 7).
 */

/** The exports of one module, as `import.meta.glob` hands them over. */
export type ModuleExports = Readonly<Record<string, unknown>>;
