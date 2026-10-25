/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/contracts` (with
 *          the Port, Enum, define* and MigrationRunner moves of the 2026-10-24 decisions) is exported, nothing else
 *          is, and every type it imports resolves.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0127 2026-10-24 note.
 */
import { describe, expect, it } from "@stackra/testing";

import * as contracts from "#core/index";
import type {
  Actor,
  AppDefinition,
  Branded,
  DataKey,
  Email,
  HealthReport,
  Json,
  PackageDefinition,
  PublicId,
  ScopeRef,
  ServiceDefinition,
  StackraManifest,
  Url,
  VerifiedPrincipal,
  WorkerDefinition,
} from "#core/index";

/** Every type the entry exports; this alias fails to compile if one stops resolving. */
type EntryTypes = [
  Actor,
  AppDefinition,
  Branded<string, "x">,
  DataKey,
  Email,
  HealthReport,
  Json,
  PackageDefinition,
  PublicId<"usr">,
  ScopeRef,
  ServiceDefinition,
  StackraManifest,
  Url,
  VerifiedPrincipal,
  WorkerDefinition,
];

describe("@stackra/contracts", () => {
  it("exports exactly the runtime vocabulary", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "ActorKind",
      "ApiArea",
      "Clock",
      "DataClassification",
      "Duration",
      "Enum",
      "FieldCipher",
      "HealthIndicator",
      "HealthStatus",
      "HttpMethod",
      "IdentityResolver",
      "KeyProvider",
      "Logger",
      "MigrationRunner",
      "Port",
      "Realm",
      "SortDirection",
      "Target",
      "Tone",
      "brand",
      "defineApp",
      "definePackage",
      "defineService",
      "defineWorker",
    ]);
  });

  it("exports every type the template imports", () => {
    const types: EntryTypes | undefined = undefined;
    expect(types).toBeUndefined();
  });
});
