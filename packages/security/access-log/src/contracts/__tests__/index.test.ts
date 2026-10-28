/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the `AccessLogSink` port is its only value, and the types
 *          the template's sinks and tests read keep their shape.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import type { Actor, DataClassification } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";

describe("@stackra/access-log/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual(["AccessLogSink"]);
  });

  it("keeps the record, link and options shapes", () => {
    expectTypeOf<contracts.AccessRecord["actor"]>().toEqualTypeOf<Actor>();
    expectTypeOf<contracts.AccessRecord["subjects"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<contracts.AccessLink>().toExtend<contracts.AccessRecord>();
    expectTypeOf<contracts.AccessLink["sequence"]>().toEqualTypeOf<number>();
    expectTypeOf<contracts.AuditLink>().toExtend<contracts.AuditRecord>();
    expectTypeOf<contracts.AuditRecord["actor"]>().toEqualTypeOf<Actor>();
    expectTypeOf<contracts.AuditRecord["outcome"]>().toEqualTypeOf<"ok" | "refused">();
    expectTypeOf<contracts.AuditRecord["code"]>().toEqualTypeOf<string | null>();
    expectTypeOf<
      contracts.AccessLoggedOptions["classification"]
    >().toEqualTypeOf<DataClassification>();
    expectTypeOf<contracts.AccessLoggedOptions["subjects"]>().toEqualTypeOf<string | undefined>();
  });
});
