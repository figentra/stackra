/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the pure compiler (identities, manifest and its checks, shape
 *          compiler, wiring, member module, entries, entities, registrations, boot, webhooks, prefixes, routes, blocks,
 *          generated service clients, setting keys, tool configs, openapi projection, the prefix registry, the surface targets and
 *          the bundle modulepreload list, the model additions section, the system graph of ADR 0452) is exported and nothing
 *          internal is (the case helpers, the import printer, the platform evaluator, the emitters' path helpers), and
 *          the IR types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); ADR 0127 2026-10-24 note.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as gen from "#core/index";
import type {
  EntityIR,
  GenError,
  GeneratedFile,
  MemberIR,
  RelationIR,
  ShapeIR,
  TypeDesc,
} from "#core/index";

describe("@stackra/gen", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(gen).sort()).toEqual([
      "CLIENTS_SPECIFIER",
      "DOCS_CONFIG_FILE",
      "DOCS_SITE_DIR",
      "DocsConfig",
      "EFFECT_TAGS",
      "GENERATED_NOTICE",
      "GRAPH_NOTICE",
      "INTEGRATION_ROLES",
      "MANIFEST_NOTICE",
      "PUBLIC_ID_PREFIXES",
      "actionKey",
      "additionsOf",
      "blockKey",
      "buildManifest",
      "checkIdentityLock",
      "checkSurfaces",
      "compareManifests",
      "configKeyOf",
      "cronJobId",
      "deriveEndpoint",
      "driverName",
      "egressOf",
      "emitBlocks",
      "emitBoot",
      "emitClients",
      "emitDocsSite",
      "emitEncoreCronJobs",
      "emitEncoreHttp",
      "emitEncoreQueues",
      "emitEntities",
      "emitI18n",
      "emitMemberModule",
      "emitPackageEntries",
      "emitPrefixes",
      "emitRegistrations",
      "emitRoutes",
      "emitRuntimeEntries",
      "emitSchemas",
      "emitSdks",
      "emitSettings",
      "emitToolConfigs",
      "emitWebhooks",
      "emitWiring",
      "eventName",
      "folderKey",
      "formatGenError",
      "generateMember",
      "integrationKey",
      "jsonSchemaOf",
      "memberGraphOf",
      "modelKey",
      "modulepreloadOf",
      "openApiOf",
      "permissionKey",
      "portKey",
      "rootModuleOf",
      "routeKey",
      "sequenceKey",
      "surfacesOf",
      "systemGraph",
      "tableName",
      "toolHints",
      "toolName",
      "webhookPath",
    ]);
  });

  it("resolves its public types", () => {
    expectTypeOf(gen.generateMember)
      .returns.toHaveProperty("files")
      .toEqualTypeOf<readonly GeneratedFile[]>();
    expectTypeOf(gen.buildManifest)
      .returns.toHaveProperty("manifest")
      .toEqualTypeOf<StackraManifest>();
    expectTypeOf<MemberIR["errors"]>().toEqualTypeOf<readonly GenError[]>();
    expectTypeOf<Extract<TypeDesc, { kind: "public_id" }>["prefix"]>().toEqualTypeOf<string>();
    expectTypeOf<ShapeIR["entity"]>().toEqualTypeOf<EntityIR | undefined>();
    expectTypeOf<EntityIR["relations"]>().toEqualTypeOf<readonly RelationIR[]>();
  });
});
