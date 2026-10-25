/**
 * Stackra file contract:
 * Purpose: test config of @stackra/vitest-config: the `toolingPreset` role it ships (plain Node, explicit vitest
 *          imports, an empty suite fails), imported by relative path because a package cannot depend on itself.
 * Boundary: the preset's own tests only; it adds nothing to the role.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement)
 */
import { toolingPreset } from "./src/factories.ts";

export default toolingPreset;
