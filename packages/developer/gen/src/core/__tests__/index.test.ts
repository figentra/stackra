/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the pure compiler (identities, manifest and its checks, shape
 *          compiler, wiring, member module, entries, openapi projection) is exported and nothing internal is (the
 *          case helpers, the import printer, the platform evaluator), and the IR types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); ADR 0127 2026-10-24 note.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as gen from "#core/index";
import type { GenError, GeneratedFile, MemberIR, TypeDesc } from "#core/index";

describe("@stackra/gen", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(gen).sort()).toEqual([
      "GENERATED_NOTICE",
      "MANIFEST_NOTICE",
      "actionKey",
      "buildManifest",
      "checkIdentityLock",
      "compareManifests",
      "configKeyOf",
      "deriveEndpoint",
      "driverName",
      "emitMemberModule",
      "emitPackageEntries",
      "emitRuntimeEntries",
      "emitSchemas",
      "emitWiring",
      "eventName",
      "folderKey",
      "formatGenError",
      "generateMember",
      "jsonSchemaOf",
      "modelKey",
      "openApiOf",
      "permissionKey",
      "portKey",
      "rootModuleOf",
      "tableName",
      "toolName",
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
  });
});
