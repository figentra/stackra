/**
 * Stackra file contract:
 * Purpose: `checkService(member)`, the findings of a service member: no Encore file (gen generates them), and a v2 service
 *          names an existing root module in `stackra.module` while a v3 service has `stackra.config.ts` and its root
 *          module (existence only; the v3 shape checks are STA-338 and STA-340).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0091; ADR 0124; ADR 0090; ADR 0294 (rule R12).
 */
import { MEMBER_ROOT } from "#node/constants/member-root.constant";
import { isV2Service } from "#node/functions/is-v2-service.function";
import { rootModuleOf } from "#node/functions/root-module-of.function";
import type { PackageManifest } from "#node/types/package-manifest.type";

const ENCORE_FILE = /(^|\/)(encore\.service\.ts|encore\.app)$/;

/**
 * The service findings of one member.
 *
 * @param member - `dir`, `pkg`, and `paths`, the member's files relative to the member directory.
 * @example
 * checkService({ dir: "services/notes", pkg, paths: ["stackra.config.ts", "src/notes.module.ts"] }); // []
 */
export function checkService(member: {
  readonly dir: string;
  readonly pkg: PackageManifest;
  readonly paths: readonly string[];
}): string[] {
  const { dir, pkg, paths } = member;
  const out: string[] = [];
  if (isV2Service(paths)) {
    const module = pkg.stackra?.module;
    if (!module)
      out.push('package.json has no "stackra": { "module": "./src/<name>.module.ts" } (ADR 0090)');
    else if (!paths.includes(module.replace(/^\.\//, "")))
      out.push(`package.json stackra.module ${module} does not exist`);
  } else {
    for (const file of [MEMBER_ROOT.config, rootModuleOf(dir)])
      if (file !== null && !paths.includes(file))
        out.push(
          `${file} missing (v3 service shape, ADR 0294 R12; a v2 service keeps src/main.ts until STA-344)`,
        );
  }
  for (const p of paths.filter((f) => ENCORE_FILE.test(f)))
    out.push(`${p}: services hold no Encore files; stackra gen generates them (ADR 0124)`);
  return out;
}
