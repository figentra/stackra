/**
 * Stackra file contract:
 * Purpose: type tests of `QueueNames<N>`: each snake_case name becomes a PascalCase case whose code is the name, and
 *          the result is an `Enum.Of` value.
 * Boundary: test only; types checked by vitest's `expectTypeOf`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0305 (rule 28).
 */
import type { Enum } from "@stackra/contracts";
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { QueueNames } from "#core/types/queue-names.type";

type Queues = QueueNames<readonly ["default", "bulk_import", "dead_letter_replay"]>;

describe("QueueNames", () => {
  it("cases each name in PascalCase with the name as its code", () => {
    expectTypeOf<Queues["Default"]>().toEqualTypeOf<"default">();
    expectTypeOf<Queues["BulkImport"]>().toEqualTypeOf<"bulk_import">();
    expectTypeOf<Queues["DeadLetterReplay"]>().toEqualTypeOf<"dead_letter_replay">();
  });

  it("is an enum of the names", () => {
    expectTypeOf<Enum.Value<Queues>>().toEqualTypeOf<
      "default" | "bulk_import" | "dead_letter_replay"
    >();
  });
});
