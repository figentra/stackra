/**
 * Stackra file contract:
 * Purpose: `generateMember`, gen-core's whole output for one member as a pure function of what discovery read: the
 *          committed `stackra.manifest.json` (and `openapi.json` for a service or app with endpoints), one schemas
 *          file per module, the wiring, the member module when none is authored, and the package entries or runtime
 *          entries, after the identity checks and, against the committed manifest, the `@Renamed` lock.
 * Boundary: pure: returns files, never writes them. Any error (discovery's, the manifest's or the lock's) means no
 *           file at all, so a broken run never leaves half an output behind. Per-target outputs (clients, routes,
 *           entities, tool configs, ...) are added by their owning packages.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 10, 22 and 26); ADR 0295 (decisions 5 and 7); ADR 0305 (rules 15, 16 and
 *                     36); registry v3.1 section 5 (gen-core items 2 to 6 and gap G1).
 */
import type { StackraManifest } from "@stackra/contracts";

import { buildManifest } from "#core/functions/build-manifest.function";
import { checkIdentityLock } from "#core/functions/check-identity-lock.function";
import { emitMemberModule } from "#core/functions/emit-member-module.function";
import { emitPackageEntries } from "#core/functions/emit-package-entries.function";
import { emitRuntimeEntries } from "#core/functions/emit-runtime-entries.function";
import { emitSchemas } from "#core/functions/emit-schemas.function";
import { emitWiring } from "#core/functions/emit-wiring.function";
import { openApiOf } from "#core/functions/open-api-of.function";
import type { GenError } from "#core/types/gen-error.type";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** JSON as gen commits it: two-space indent and a final newline. */
function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Every file gen-core writes for `ir`.
 *
 * @param ir - the member read by discovery.
 * @param previous - the committed manifest, whose identities are locked; absent on the first run.
 * @example
 * const { files, errors } = generateMember(ir, committed);
 * if (errors.length === 0) files.map((file) => file.path);
 */
export function generateMember(
  ir: MemberIR,
  previous?: StackraManifest,
): {
  readonly files: readonly GeneratedFile[];
  readonly errors: readonly GenError[];
  readonly manifest: StackraManifest;
} {
  const { manifest, errors } = buildManifest(ir);
  const all: GenError[] = [...ir.errors, ...errors];
  if (previous !== undefined) {
    const renames = new Map(
      ir.classes.flatMap((declared) =>
        declared.renamed === undefined ? [] : [[declared.name, declared.renamed] as const],
      ),
    );
    all.push(...checkIdentityLock(previous, manifest, renames));
  }
  if (all.length > 0) return { files: [], errors: all, manifest };

  const files: GeneratedFile[] = [{ path: "stackra.manifest.json", content: json(manifest) }];
  if (
    (ir.layout === "service" || ir.layout === "app") &&
    (manifest.actions ?? []).some((action) => typeof action["endpoint"] === "object")
  )
    files.push({ path: "openapi.json", content: json(openApiOf(manifest)) });
  const modules = new Set([
    ...ir.shapes.map((shape) => shape.module),
    ...ir.enums.map((declaration) => declaration.module),
    ...ir.classes
      .filter(
        (declared) =>
          declared.kind === "action" || declared.kind === "query" || declared.kind === "config",
      )
      .map((declared) => declared.module),
  ]);
  for (const module of [...modules].sort())
    files.push({ path: `.stackra/gen/schemas/${module}.ts`, content: emitSchemas(ir, module) });
  files.push({ path: ".stackra/gen/wiring.ts", content: emitWiring(ir) });
  const memberModule = emitMemberModule(ir);
  if (memberModule !== undefined)
    files.push({ path: ".stackra/gen/module.ts", content: memberModule });
  files.push(...emitPackageEntries(ir), ...emitRuntimeEntries(ir));
  return { files, errors: [], manifest };
}
