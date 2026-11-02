/**
 * Stackra file contract:
 * Purpose: `ModuleLoader`, how `generate` imports a member's own source that Node's type stripping cannot load (its
 *          classes carry decorators): `stackra gen` passes one built on Vite's module runner.
 * Boundary: a type only. Gen calls it once per run with one generated module, so every class it reaches shares one
 *           runner and one kind registry.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 5: gen records each resource's tree); STA-1947.
 */

/** Imports the module at `file` (absolute) for the member at `root` and resolves to its exports. */
export type ModuleLoader = (file: string, root: string) => Promise<Record<string, unknown>>;
