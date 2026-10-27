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
  AwsKmsApi,
  AwsKmsKeyProviderOptions,
  AwsKmsSignerOptions,
  Branded,
  DataKey,
  Email,
  HealthReport,
  Json,
  PackageDefinition,
  PublicId,
  ScopeRef,
  ServiceDefinition,
  Signature,
  SignerPublicKey,
  StackraManifest,
  TraceAttributes,
  TraceSpan,
  Url,
  VerifiedPrincipal,
  WorkerDefinition,
  WrappedDataKey,
} from "#core/index";

/** Every type the entry exports; this alias fails to compile if one stops resolving. */
type EntryTypes = [
  Actor,
  AppDefinition,
  AwsKmsApi,
  AwsKmsKeyProviderOptions,
  AwsKmsSignerOptions,
  Branded<string, "x">,
  DataKey,
  Email,
  HealthReport,
  Json,
  PackageDefinition,
  PublicId<"usr">,
  ScopeRef,
  ServiceDefinition,
  Signature,
  SignerPublicKey,
  StackraManifest,
  TraceAttributes,
  TraceSpan,
  Url,
  VerifiedPrincipal,
  WorkerDefinition,
  WrappedDataKey,
];

describe("@stackra/contracts", () => {
  it("exports exactly the runtime vocabulary", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "ActorKind",
      "AesGcmFieldCipherDriver",
      "ApiArea",
      "AwsKmsKeyProviderDriver",
      "AwsKmsSignerDriver",
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
      "MemoryKeyProviderDriver",
      "MemorySignerDriver",
      "MigrationRunner",
      "NoopTracerDriver",
      "Port",
      "PrincipalDirectory",
      "Realm",
      "Signer",
      "SortDirection",
      "SubjectKeyProviderDriver",
      "Target",
      "Tone",
      "Tracer",
      "brand",
      "defineApp",
      "definePackage",
      "defineService",
      "defineWorker",
      "mintPublicId",
      "verifySignature",
      "wrapScopeKey",
    ]);
  });

  it("exports every type the template imports", () => {
    const types: EntryTypes | undefined = undefined;
    expect(types).toBeUndefined();
  });
});
