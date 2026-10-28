/**
 * Stackra file contract:
 * Purpose: `generateMember`, gen-core's whole output for one member as a pure function of what discovery read: the
 *          committed `stackra.manifest.json` (and `openapi.json` for a service or app with endpoints), one schemas
 *          file and one entity file per module, the wiring, the member module when none is authored, the
 *          registrations, a service's boot and inbound webhook route, a service's Encore CronJobs, its HTTP adapter
 *          (CORS preflights and headers, STA-1385), broker-delivered
 *          queue topics, integration event topics and (for a relay service) the subscriptions to every product topic, the public id prefixes, an app's route tables and blocks, the public SDKs (TypeScript, Python and PHP) of the actions marked public, one generated client per consumed
 *          service (injected, listened to, or imported by any file, so an app's routes count), `#stackra/settings`
 *          (the setting keys of its settings classes, stackra-209), `#stackra/i18n` from
 *          the lang catalogues and those of the declared `@stackra/*` packages, the package entries or runtime entries, the tool configs and the
 *          member's part of the system graph (`.stackra/graph.json`, ADR 0452), after the identity checks and,
 *          against the committed manifest, the `@Renamed` lock.
 * Boundary: pure: returns files, never writes them. Any error (discovery's, the manifest's or the lock's) means no
 *           file at all, so a broken run never leaves half an output behind. Two narrower passes break cycles between
 *           services: the manifest pass (the manifest alone, not blocked by a consumed workspace service whose
 *           manifest is still to come) and the clients pass (the client files alone, from the producers' manifests). A client or schema file that imports
 *           a `@stackra/*` package (a schema file also zod) the member does not declare is refused (`client_dependency_missing`,
 *           `schema_dependency_missing`), and so is any other generated file (`generated_dependency_missing`, STA-1296), and so is a lang namespace clash
 *           or a key no merged catalogue ships (`i18n_namespace_clash`, `i18n_key_missing`, STA-1298), and so is a broken
 *           convention (`checkConventions`, STA-1306), a semantic `@Searchable` over an `ai: never` field
 *           (`checkSemanticSearch`, STA-1251), an encryption mismatch or a write past the unit of work on an encrypted
 *           model (`checkEncryptedFields`, stackra-262), a service model neither owned nor global (`checkModelScope`,
 *           `model_tenancy_missing`, stackra-258) or a slot fill that breaks its slot's contract (`checkSlotFills`,
 *           ADR 0438) or two shell dependencies on one surface with different lines (`checkSurfaces`,
 *           `surface_targets_conflict`, ADR 0436) on the full pass only. Other per-target outputs (navigation trees, the rest of the Encore app, ...)
 *           are added by their owning targets. Every JSON file is written in the repository formatter's shape
 *           (`formatJson`, stackra-247), so the committed manifest and openapi.json pass `oxfmt --check`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 10, 22 and 26); ADR 0295 (decisions 5 and 7); ADR 0305 (rules 15, 16 and
 *                     36); ADR 0097 (decision 3); registry v3.1 section 5 (gen-core items 2 to 6 and gap G1); ADR 0148
 *                     (decisions 3, 4 and 6: Encore CronJobs and Pub/Sub in SaaS); ADR 0260 (decision 3: one
 *                     generated client per service; decision 4: the relay hears every event; a cycle between services is allowed at the manifest level); STA-1293 (the i18n target, clients
 *                     imported by any file, undeclared packages refused); ADR 0452 (the member graph); STA-1365 (a
 *                     member off `@stackra/container` gets no wiring and no member module, `usesContainer`).
 */
import type { StackraManifest } from "@stackra/contracts";

import { buildManifest } from "#core/functions/build-manifest.function";
import { checkConventions } from "#core/functions/check-conventions.function";
import { checkEncryptedFields } from "#core/functions/check-encrypted-fields.function";
import { checkModelScope } from "#core/functions/check-model-scope.function";
import { checkSemanticSearch } from "#core/functions/check-semantic-search.function";
import { checkI18n } from "#core/functions/check-i18n.function";
import { checkIdentityLock } from "#core/functions/check-identity-lock.function";
import { checkSlotFills } from "#core/functions/check-slot-fills.function";
import { checkSurfaces } from "#core/functions/check-surfaces.function";
import { formatJson } from "#core/functions/format-json.function";
import { emitBlocks } from "#core/functions/emit-blocks.function";
import { emitBoot } from "#core/functions/emit-boot.function";
import { emitIsolationTest } from "#core/functions/emit-isolation-test.function";
import { emitClients } from "#core/functions/emit-clients.function";
import { emitEncoreCronJobs } from "#core/functions/emit-encore-cron-jobs.function";
import { emitEncoreEvents } from "#core/functions/emit-encore-events.function";
import { emitEncoreHttp } from "#core/functions/emit-encore-http.function";
import { emitEncoreQueues } from "#core/functions/emit-encore-queues.function";
import { emitEntities } from "#core/functions/emit-entities.function";
import { emitI18n } from "#core/functions/emit-i18n.function";
import { emitMemberModule } from "#core/functions/emit-member-module.function";
import { emitPackageEntries } from "#core/functions/emit-package-entries.function";
import { emitPrefixes } from "#core/functions/emit-prefixes.function";
import { emitRegistrations } from "#core/functions/emit-registrations.function";
import { emitRoutes } from "#core/functions/emit-routes.function";
import { emitRuntimeEntries } from "#core/functions/emit-runtime-entries.function";
import { emitSchemas } from "#core/functions/emit-schemas.function";
import { emitSdks } from "#core/functions/emit-sdks.function";
import { emitSettings } from "#core/functions/emit-settings.function";
import { emitToolConfigs } from "#core/functions/emit-tool-configs.function";
import { emitWebhooks } from "#core/functions/emit-webhooks.function";
import { emitWiring } from "#core/functions/emit-wiring.function";
import { usesContainer } from "#core/functions/uses-container.function";
import { memberGraphOf } from "#core/functions/member-graph-of.function";
import { openApiOf } from "#core/functions/open-api-of.function";
import { schemaModules } from "#core/functions/schema-modules.function";
import { undeclaredPackages } from "#core/functions/undeclared-packages.function";
import type { GenError } from "#core/types/gen-error.type";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** JSON as gen commits it: in the repository formatter's shape, so `oxfmt --check` passes (stackra-247). */
const json = formatJson;

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
  const emitted = emitClients(ir);
  const undeclared = undeclaredPackages(ir, emitted.files, "client_dependency_missing");
  const clients =
    undeclared.length > 0 ? { files: [], errors: [...emitted.errors, ...undeclared] } : emitted;
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
  // The i18n target refuses a namespace clash and a key no merged catalogue ships (STA-1298); the quality-gate
  // conventions refuse here too, never in the manifest pass, so `stackra gen --manifests` still writes (STA-1306).
  // The slot contract refuses a fill of an undeclared slot, another surface or other props (ADR 0438); one surface on
  // two shell lines is refused too (ADR 0436).
  all.push(
    ...clients.errors,
    ...checkI18n(ir),
    ...checkConventions(ir, manifest),
    ...checkSemanticSearch(ir),
    ...checkEncryptedFields(ir),
    ...checkModelScope(ir),
    ...checkSlotFills(ir),
    ...checkSurfaces(ir),
  );
  if (all.length > 0) return { files: [], errors: all, manifest };

  const files: GeneratedFile[] = [{ path: "stackra.manifest.json", content: json(manifest) }];
  if (
    (ir.layout === "service" || ir.layout === "app") &&
    (manifest.actions ?? []).some((action) => typeof action["endpoint"] === "object")
  )
    files.push({ path: "openapi.json", content: json(openApiOf(manifest)) });
  if (ir.layout === "service" || ir.layout === "app") files.push(...emitSdks(manifest));
  const schemas = schemaModules(ir).map((module) => ({
    path: `.stackra/gen/schemas/${module}.ts`,
    content: emitSchemas(ir, module),
  }));
  // A schemas file also imports zod, which a member with schemas to compile declares (most enum-only ones have none).
  const missing = undeclaredPackages(ir, schemas, "schema_dependency_missing", ["zod"]);
  if (missing.length > 0) return { files: [], errors: missing, manifest };
  files.push(...schemas);
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  for (const module of [...new Set(ir.shapes.map((shape) => shape.module))].sort()) {
    const entities = emitEntities(ir, module);
    if (entities !== undefined)
      files.push({ path: `.stackra/gen/entities/${module}.ts`, content: entities });
  }
  // A member off the container (`@stackra/testing`, rule 6c) has nothing to wire and no module (STA-1365 item 8).
  const container = usesContainer(ir);
  if (container) files.push({ path: ".stackra/gen/wiring.ts", content: emitWiring(ir) });
  const memberModule = container ? emitMemberModule(ir) : undefined;
  if (memberModule !== undefined)
    files.push({ path: ".stackra/gen/module.ts", content: memberModule });
  const optional: readonly (readonly [string, string | undefined])[] = [
    [".stackra/gen/registrations.ts", emitRegistrations(ir, manifest)],
    [".stackra/gen/boot.ts", emitBoot(ir)],
    [".stackra/gen/webhooks.ts", emitWebhooks(ir)],
    [".stackra/gen/prefixes.ts", emitPrefixes(manifest)],
    [".stackra/gen/i18n.ts", emitI18n(ir)?.content],
    [".stackra/gen/settings.ts", emitSettings(ir)],
    [".stackra/tests/tenant-isolation.int.test.ts", emitIsolationTest(ir)],
  ];
  for (const [path, content] of optional) if (content !== undefined) files.push({ path, content });
  for (const encore of [
    emitEncoreCronJobs(ir, manifest),
    emitEncoreQueues(ir, manifest),
    emitEncoreHttp(ir),
  ])
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
  // Every other generated file is held to the same rule: the wiring's driver entries (`@stackra/content/node`), the
  // test setup's testing subpaths, the tool configs (STA-1296).
  const elsewhere = undeclaredPackages(
    ir,
    files.filter(
      (file) =>
        !file.path.startsWith(".stackra/gen/clients/") &&
        !file.path.startsWith(".stackra/gen/schemas/"),
    ),
    "generated_dependency_missing",
  );
  if (elsewhere.length > 0) return { files: [], errors: elsewhere, manifest };
  // The member's part of the system graph, read by the repo step (ADR 0452).
  files.push({ path: ".stackra/graph.json", content: json(memberGraphOf(ir, manifest)) });
  return { files, errors: [], manifest };
}
