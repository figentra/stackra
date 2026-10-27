/**
 * Stackra file contract:
 * Purpose: `SandboxLanguage`, the language of a code step: `javascript` (QuickJS-WASM) or `python` (Pyodide).
 * Boundary: a type only; the optional `language` of `SandboxRequest`, `javascript` when absent. `Sandbox.run` runs
 *           JavaScript only; Python runs only in a `SandboxPool` process (ADR 0434 decision 1).
 * Runtime: isomorphic
 * Governing contract: ADR 0154 (decision 2); ADR 0434 (decision 1).
 */

/**
 * The engine a code step runs in.
 *
 * @example
 * await pool.run({ ...request, language: "python" });
 */
export type SandboxLanguage = "javascript" | "python";
