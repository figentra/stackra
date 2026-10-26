/**
 * Stackra file contract:
 * Purpose: `MEMBER_ROOT`, what every member authors at its root: `stackra.config.ts` and one root module, never
 *          `src/main.ts` or an entry barrel; the docs app and the `tier:config` presets are exempt.
 * Boundary: data only; `rootModuleOf` reads it.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R12); ADR 0295 (decisions 1 and 7).
 */
import { TOOLING } from "#node/constants/tooling.constant";

/**
 * What every member authors at its root (ADR 0294 rule R12, ADR 0295 decisions 1 and 7): `stackra.config.ts` and one
 * root module; never `src/main.ts` or an entry barrel. The docs app and the `tier:config` presets are exempt: `dir`
 * is the member directory, or with a trailing slash the prefix of the directories, that an exemption covers.
 */
export const MEMBER_ROOT = Object.freeze({
  config: "stackra.config.ts",
  rootModule: "src/<name>.module.ts",
  packageRootModule: "src/node/<name>.module.ts",
  exempt: Object.freeze([
    Object.freeze({ dir: "apps/docs", label: "the Mintlify docs app" }),
    Object.freeze({ dir: `packages/${TOOLING.name}/`, label: "the `tier:config` presets" }),
  ]),
  reason: "one member shape; gen writes the entries, the tool configs and the barrels",
  adr: "0294 R12, 0295",
});
