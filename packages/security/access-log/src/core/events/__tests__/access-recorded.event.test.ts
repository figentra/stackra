/**
 * Stackra file contract:
 * Purpose: unit tests of `AccessRecorded`: an integration event named `access_record.recorded` that carries the
 *          record's fields, with a registered schema that refuses an unknown data class.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0141; ADR 0212 (decision 5); ADR 0409.
 */
import { ActorKind, DataClassification } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { AccessRecorded } from "#core/events/access-recorded.event";

const FIELDS = {
  callId: "call_1",
  actor: { kind: ActorKind.Service, id: "svc_support" },
  target: "Tenants.view",
  classification: DataClassification.Pseudonymous,
  subjects: ["usr_1"],
  at: "2026-10-26T09:00:00.000Z",
};

describe(AccessRecorded, () => {
  it("carries the record's fields", () => {
    expect(AccessRecorded.create(FIELDS)).toMatchObject(FIELDS);
  });

  it("registers a schema that refuses an unknown class", () => {
    const schema = schemaOf(AccessRecorded);
    expect(schema.safeParse(FIELDS).success).toBe(true);
    expect(schema.safeParse({ ...FIELDS, classification: "secret" }).success).toBe(false);
  });
});
