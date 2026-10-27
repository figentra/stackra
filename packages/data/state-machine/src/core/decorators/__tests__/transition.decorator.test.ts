/**
 * Stackra file contract:
 * Purpose: unit tests of `@Transition`: it is a method decorator of the `state_machine` kind that records its options
 *          by method name (a subclass's own win), and it throws a TypeError at class definition on a field or on a
 *          class that is not a state machine.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 6 and 23); ADR 0161 (0294 note).
 */
import { DecoratorTarget } from "@stackra/container";
import { Enum } from "@stackra/contracts";
import { Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { StateMachine } from "#core/bases/state-machine.base";
import { Transition } from "#core/decorators/transition.decorator";

const ProductStatus = Enum.of({ Draft: "draft", Active: "active", Archived: "archived" });
type ProductStatus = Enum.Value<typeof ProductStatus>;

class Product extends Model {
  status: ProductStatus = ProductStatus.Draft;
}

class ProductStateMachine extends StateMachine<Product>({ field: "status" }) {
  @Transition({
    from: ProductStatus.Draft,
    to: ProductStatus.Active,
  })
  activate(_product: Product): void {
    // the decorator writes the status; nothing else changes
  }

  @Transition({
    from: ProductStatus.Active,
    to: ProductStatus.Archived,
  })
  archive(_product: Product): void {
    // the decorator writes the status; nothing else changes
  }
}

describe("Transition", () => {
  it("is a method decorator of state machines", () => {
    expect(Transition.kind).toBe("transition");
    expect(Transition.target).toBe(DecoratorTarget.Method);
    expect(Transition.kinds).toEqual(["state_machine"]);
  });

  it("records its options by method name, a subclass's own winning", () => {
    expect([...Transition.members(ProductStateMachine)]).toEqual([
      ["activate", { from: ProductStatus.Draft, to: ProductStatus.Active }],
      ["archive", { from: ProductStatus.Active, to: ProductStatus.Archived }],
    ]);
    class ReopeningProductStateMachine extends ProductStateMachine {
      @Transition({
        from: [ProductStatus.Active, ProductStatus.Archived],
        to: ProductStatus.Archived,
      })
      override archive(_product: Product): void {
        // an override keeps the transition and may widen its from states
      }
    }
    expect(Transition.members(ReopeningProductStateMachine).get("archive")).toEqual({
      from: [ProductStatus.Active, ProductStatus.Archived],
      to: ProductStatus.Archived,
    });
  });

  it("refuses a field and a class that is not a state machine", () => {
    expect(() => {
      class OnField extends StateMachine<Product>({ field: "status" }) {
        @Transition({
          from: ProductStatus.Draft,
          to: ProductStatus.Active,
        })
        activate = 1;
      }
      return OnField;
    }).toThrow(TypeError);
    expect(() => {
      class Plain {
        @Transition({
          from: ProductStatus.Draft,
          to: ProductStatus.Active,
        })
        activate(): void {
          // never reached: the decorator throws at class definition
        }
      }
      return Plain;
    }).toThrow(TypeError);
  });
});
