/**
 * Stackra file contract:
 * Purpose: `ROOT_MODULE`, the kind of a member's root module, `src/<name>.module.ts`, whose test is the integration tier.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0090; settlement contradiction 8.
 */
import type { KindFolder } from "#node/types/kind-folder.type";

/** The root module of a member, `src/<name>.module.ts`. Its test is the integration tier (settlement contradiction 8). */
export const ROOT_MODULE: KindFolder = Object.freeze({
  folder: null,
  suffix: "module",
  test: "int",
  reason: "a member's root module; its test creates the module through createTestingModule",
  adr: "0090",
});
