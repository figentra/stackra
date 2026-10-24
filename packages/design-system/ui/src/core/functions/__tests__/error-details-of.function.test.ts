/**
 * Stackra file contract:
 * Purpose: proves `errorDetailsOf` reads a message from an `Error`, an error-like object, a string and a number, keeps a
 *          stack only when the value has a string one, and returns nothing for a value with no text of its own (an
 *          empty string, `null`, a plain object, a function), so an ErrorState never prints `[object Object]`.
 * Boundary: pure function, no DOM.
 * Runtime: node
 * Governing contract: ADR 0313 (decision 6); ADR 0022 (test placement).
 */
// @covers sta-350:FR-148
import { errorDetailsOf } from "#core/functions/error-details-of.function";

describe("errorDetailsOf", () => {
  it("reads the message and the stack of an Error", () => {
    const error = new Error("Order service is down");
    expect(errorDetailsOf(error)).toEqual({ message: "Order service is down", stack: error.stack });
  });

  it("reads an error-like object, with no stack when it has none", () => {
    expect(errorDetailsOf({ message: "order_not_payable" })).toEqual({
      message: "order_not_payable",
      stack: undefined,
    });
    expect(errorDetailsOf({ message: "x", stack: 3 })).toEqual({ message: "x", stack: undefined });
  });

  it("reads a string and a number as the message", () => {
    expect(errorDetailsOf("Something broke")).toEqual({ message: "Something broke" });
    expect(errorDetailsOf(503)).toEqual({ message: "503" });
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["an empty string", ""],
    ["an error with no message", new Error("")],
    ["a plain object", { code: 500 }],
    ["an object whose message is not text", { message: 5 }],
    ["a function", () => undefined],
  ])("returns nothing for %s", (_name, value) => {
    expect(errorDetailsOf(value)).toBeUndefined();
  });
});
