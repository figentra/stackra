/**
 * Stackra file contract:
 * Purpose: `generateMember`, gen-core's whole output for one member as a pure function of what discovery read: the
 *          committed `stackra.manifest.json` (and `openapi.json` for a service or app with endpoints), one schemas
 *          file and one entity file per module, the wiring, the member module when none is authored, the
 *          registrations, a service's boot and inbound webhook route, a service's Encore CronJobs, broker-delivered
 *          queue topics, integration event topics and (for a relay service) the subscriptions to every product topic, the public id prefixes, an app's route tables and blocks, the public SDKs (TypeScript, Python and PHP) of the actions marked public, one generated client per consumed
 *          service, the package entries or runtime entries, and the tool configs, after the identity checks and,
 *          against the committed manifest, the `@Renamed` lock.
 * Boundary: pure: returns files, never writes them. Any error (discovery's, the manifest's or the lock's) means no
 *           file at all, so a broken run never leaves half an output behind. Two narrower passes break cycles between
 *           services: the manifest pass (the manifest alone, not blocked by a consumed workspace service whose
 *           manifest is still to come) and the clients pass (the client files alone, from the producers' manifests). Other per-target outputs (navigation
 *           trees, i18n, the rest of the Encore app, ...) are added by their owning targets.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 10, 22 and 26); ADR 0295 (decisions 5 and 7); ADR 0305 (rules 15, 16 and
 *                     36); ADR 0097 (decision 3); registry v3.1 section 5 (gen-core items 2 to 6 and gap G1); ADR 0148
 *                     (decisions 3, 4 and 6: Encore CronJobs and Pub/Sub in SaaS); ADR 0260 (decision 3: one
 *                     generated client per service; decision 4: the relay hears every event; a cycle between services is allowed at the manifest level).
 */
import type { StackraManifest } from "@stackra/contracts";

import { buildManifest } from "#core/functions/build-manifest.function";
import { checkIdentityLock } from "#core/functions/check-identity-lock.function";
import { emitBlocks } from "#core/functions/emit-blocks.function";
import { emitBoot } from "#core/functions/emit-boot.function";
import { emitClients } from "#core/functions/emit-clients.function";
import { emitEncoreCronJobs } from "#core/functions/emit-encore-cron-jobs.function";
import { emitEncoreEvents } from "#core/functions/emit-encore-events.function";
import { emitEncoreQueues } from "#core/functions/emit-encore-queues.function";
import { emitEntities } from "#core/functions/emit-entities.function";
import { emitMemberModule } from "#core/functions/emit-member-module.function";
import { emitPackageEntries } from "#core/functions/emit-package-entries.function";
import { emitPrefixes } from "#core/functions/emit-prefixes.function";
import { emitRegistrations } from "#core/functions/emit-registrations.function";
import { emitRoutes } from "#core/functions/emit-routes.function";
import { emitRuntimeEntries } from "#core/functions/emit-runtime-entries.function";
import { emitSchemas } from "#core/functions/emit-schemas.function";
import { emitSdks } from "#core/functions/emit-sdks.function";
import { emitToolConfigs } from "#core/functions/emit-tool-configs.function";
import { emitWebhooks } from "#core/functions/emit-webhooks.function";
import { emitWiring } from "#core/functions/emit-wiring.function";
import { openApiOf } from "#core/functions/open-api-of.function";
import { schemaModules } from "#core/functions/schema-modules.function";
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
 * @param options - `pass`: `"manifests"` returns the manifest alone, refused by anything but a consumed workspace
 *                  service still to come; `"clients"` returns the client files alone, refused only by the clients
 *                  target. Omitted, every file.
 * @example
 * const { files, errors } = generateMember(ir, committed);
 * if (errors.length === 0) files.map((file) => file.path);
 */
export function generateMember(
  ir: MemberIR,
  previous?: StackraManifest,
  options: { readonly pass?: "manifests" | "clients" } = {},
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
  const clients = emitClients(ir);
  if (options.pass === "clients") return { ...clients, manifest };
  if (options.pass === "manifests") {
    // A manifest never depends on a client: services of the same workspace are still to come, so only others refuse.
    all.push(...emitClients(ir, { pending: new Set(ir.workspaceServices) }).errors);
    return all.length > 0
      ? { files: [], errors: all, manifest }
      : {
          files: [{ path: "stackra.manifest.json", content: json(manifest) }],
          errors: [],
          manifest,
        };
  }
  all.push(...clients.errors);
  if (all.length > 0) return { files: [], errors: all, manifest };

  const files: GeneratedFile[] = [{ path: "stackra.manifest.json", content: json(manifest) }];
  if (
    (ir.layout === "service" || ir.layout === "app") &&
    (manifest.actions ?? []).some((action) => typeof action["endpoint"] === "object")
  )
    files.push({ path: "openapi.json", content: json(openApiOf(manifest)) });
  if (ir.layout === "service" || ir.layout === "app") files.push(...emitSdks(manifest));
  for (const module of schemaModules(ir))
    files.push({ path: `.stackra/gen/schemas/${module}.ts`, content: emitSchemas(ir, module) });
  for (const module of [...new Set(ir.shapes.map((shape) => shape.module))].sort()) {
    const entities = emitEntities(ir, module);
    if (entities !== undefined)
      files.push({ path: `.stackra/gen/entities/${module}.ts`, content: entities });
  }
  files.push({ path: ".stackra/gen/wiring.ts", content: emitWiring(ir) });
  const memberModule = emitMemberModule(ir);
  if (memberModule !== undefined)
    files.push({ path: ".stackra/gen/module.ts", content: memberModule });
  const optional: readonly (readonly [string, string | undefined])[] = [
    [".stackra/gen/registrations.ts", emitRegistrations(ir, manifest)],
    [".stackra/gen/boot.ts", emitBoot(ir)],
    [".stackra/gen/webhooks.ts", emitWebhooks(ir)],
    [".stackra/gen/prefixes.ts", emitPrefixes(manifest)],
  ];
  for (const [path, content] of optional) if (content !== undefined) files.push({ path, content });
  for (const encore of [emitEncoreCronJobs(ir, manifest), emitEncoreQueues(ir, manifest)])
    if (encore !== undefined) files.push(encore);
  files.push(...emitEncoreEvents(ir, manifest));
  files.push(...clients.files, ...emitRoutes(ir), ...emitBlocks(ir));
  const entries = [
    ...emitPackageEntries(ir),
    ...emitRuntimeEntries(
      ir,
      files.map((file) => file.path),
    ),
  ];
  files.push(
    ...entries,
    ...emitToolConfigs(ir, {
      entries,
      registrations: files.some((file) => file.path === ".stackra/gen/registrations.ts"),
    }),
  );
  return { files, errors: [], manifest };
}
