/**
 * Stackra file contract:
 * Purpose: `checkEncoreService(member)`, the two rules a service holds for Encore to build its app at the member root:
 *          `encore.dev` is a literal version equal to the default catalog's (Encore's `update_package_json` rewrites any
 *          other spec to `^<version>`, `catalog:` included, which breaks pnpm's frozen install), and its tsconfig carries
 *          `paths` equal to its package.json `imports` (Encore's parser ignores `imports`, and reads `paths` only when
 *          written in the app root's own tsconfig, not through `extends`), with no `baseUrl`: TypeScript 7 removed it
 *          (TS5102), and `paths` resolve from the tsconfig's folder without it.
 * Boundary: pure; the fix is `stackra encore:prepare`.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2, amendment of 2026-11-09).
 */
import { pathsOfImports } from "#node/functions/paths-of-imports.function";
import type { PackageManifest } from "#node/types/package-manifest.type";

const FIX = "run `stackra encore:prepare` in the service";

/** The JSON of `value` with its keys sorted, so two maps compare by content. */
const canonical = (value: Record<string, string[]>): string =>
  JSON.stringify(Object.entries(value).toSorted(([a], [b]) => a.localeCompare(b)));

/**
 * The Encore findings of one service member.
 *
 * @param member - the parsed package.json and tsconfig.json, and the default catalog's `encore.dev` version.
 * @example
 * checkEncoreService({ pkg, tsconfig, catalogEncore: "1.58.8" }); // []
 */
export function checkEncoreService(member: {
  readonly pkg: PackageManifest;
  readonly tsconfig?:
    | {
        readonly compilerOptions?: {
          readonly baseUrl?: string;
          readonly paths?: Record<string, string[]>;
        };
      }
    | undefined;
  readonly catalogEncore: string | undefined;
}): string[] {
  const { pkg, tsconfig, catalogEncore } = member;
  const out: string[] = [];
  const pin = pkg.dependencies?.["encore.dev"];
  if (pin !== undefined && pin !== catalogEncore)
    out.push(
      `dependencies.encore.dev = "${pin}" must be the literal ${catalogEncore ?? "<default catalog encore.dev>"}: Encore rewrites any other spec, catalog: included (ADR 0091); ${FIX}`,
    );
  if (pkg.imports === undefined) return out;
  const compiler = tsconfig?.compilerOptions;
  if (canonical(compiler?.paths ?? {}) !== canonical(pathsOfImports(pkg.imports)))
    out.push(
      `tsconfig.json compilerOptions.paths must equal package.json imports: Encore ignores imports (ADR 0091); ${FIX}`,
    );
  // TypeScript 7 refuses `baseUrl` (TS5102); `paths` resolve from the tsconfig's folder without it.
  if (compiler?.baseUrl !== undefined)
    out.push(
      `tsconfig.json compilerOptions.baseUrl must go: TypeScript 7 removed it, and paths resolve from the tsconfig's folder; ${FIX}`,
    );
  return out;
}
