/**
 * Stackra file contract:
 * Purpose: type tests of `CallInput`: a field gen lists in `~defaults` is optional for a caller, a required field stays
 *          required, a nested shape follows the same rule, and `InputOf` (what `handle` receives) keeps every field.
 * Boundary: test only; the fixture classes carry the brand by an interface merge, as gen's module augmentation does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); STA-1694.
 */
import { Schema } from "@stackra/validation";
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { CallInput, InputOf } from "#core/index";

// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- the merge is what gen's `declare module` writes
class Line extends Schema {
  sku!: string;

  quantity = 1;
}
interface Line {
  readonly "~defaults"?: "quantity";
}

// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- the merge is what gen's `declare module` writes
class CaptureInput extends Schema {
  orderId!: string;

  capturedAt: Date | null = null;

  line!: Line;
}
interface CaptureInput {
  readonly "~defaults"?: "capturedAt";
}

class Plain extends Schema {
  orderId!: string;
}

type Handler = { handle: (input: CaptureInput) => Promise<void> };
type PlainHandler = { handle: (input: Plain) => Promise<void> };

describe("CallInput", () => {
  it("makes a defaulted field optional and keeps the others required", () => {
    expectTypeOf<CallInput<Handler>>().toEqualTypeOf<{
      orderId: string;
      capturedAt?: Date | null;
      line: { sku: string; quantity?: number };
    }>();
  });

  it("keeps every field of the class for handle", () => {
    expectTypeOf<InputOf<Handler>>().toEqualTypeOf<CaptureInput>();
    expectTypeOf<InputOf<Handler>["capturedAt"]>().toEqualTypeOf<Date | null>();
  });

  it("requires every field of a shape gen has not narrowed", () => {
    expectTypeOf<CallInput<PlainHandler>>().toEqualTypeOf<{ orderId: string }>();
  });

  it("rejects a call that omits a required field", () => {
    // @ts-expect-error orderId is required
    const missing: CallInput<Handler> = { line: { sku: "a" } };
    const ok: CallInput<Handler> = { orderId: "o", line: { sku: "a" } };
    expectTypeOf(missing).not.toBeAny();
    expectTypeOf(ok).not.toBeAny();
  });
});
