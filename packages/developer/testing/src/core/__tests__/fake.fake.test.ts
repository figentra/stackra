/**
 * Stackra file contract:
 * Purpose: proves `Fake.of(Port)` gives a class of the port whose unimplemented methods are named spies, whose
 *          subclass adds statics and implemented methods that record calls, and that stays safe to await, print and
 *          serialise; and that `Fake` alone records calls for a double with no port.
 * Boundary: a local abstract port shaped like the template's LoyaltyMembers and AccessLogSink; no workspace port.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 2); ADR 0266 (decision 2); ADR 0022 (test placement).
 */
import { describe, expect, expectTypeOf, it, vi } from "@stackra/testing";
import { Fake } from "#core/fake.fake";

/** A port: two abstract methods and one concrete one. */
abstract class Greeter {
  abstract greet(name: string): Promise<string>;

  abstract count(): number;

  describe(): string {
    return "a greeter";
  }
}

/** The fake under test, written the way the template writes its fakes. */
class GreeterFake extends Fake.of(Greeter) {
  /** Left to the spy: `declare` satisfies the abstract member and emits nothing. */
  declare count: Greeter["count"];

  private readonly prefix: string;

  constructor(prefix: string) {
    super();
    this.prefix = prefix;
  }

  /** Shorthand, as `LoyaltyMembersFake.with([...])`. */
  static with(prefix = "Hello"): GreeterFake {
    return new GreeterFake(prefix);
  }

  override async greet(name: string): Promise<string> {
    this.record("greet", name);
    return `${this.prefix}, ${name}`;
  }
}

/** A double with no port. */
class ClockDouble extends Fake {
  tick(step: number): void {
    this.record("tick", step);
  }
}

// @covers sta-348:FR-005
describe(Fake, () => {
  it("is the port: instanceof holds and the concrete port method still works", () => {
    const fake = GreeterFake.with();
    expect(fake).toBeInstanceOf(Greeter);
    expect(fake).toBeInstanceOf(GreeterFake);
    expect(fake.describe()).toBe("a greeter");
  });

  it("runs the subclass's methods and records their calls in order", async () => {
    const fake = GreeterFake.with("Hi");
    expect(await fake.greet("Ada")).toBe("Hi, Ada");
    await fake.greet("Grace");
    expect(fake.calls("greet")).toEqual(["Ada", "Grace"]);
  });

  it("answers an unimplemented abstract method with a named spy", () => {
    const fake = GreeterFake.with();
    expect(vi.isMockFunction(fake.count)).toBe(true);
    vi.mocked(fake.count).mockReturnValue(3);
    expect(fake.count()).toBe(3);
    expect(fake.count).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fake.count).getMockName()).toBe("Greeter.count");
  });

  it("keeps one spy per method and instance", () => {
    const one = GreeterFake.with();
    const two = GreeterFake.with();
    expect(one.count).toBe(one.count);
    expect(one.count).not.toBe(two.count);
  });

  it("is safe to await, serialise and compare", async () => {
    const fake = GreeterFake.with();
    expect(await Promise.resolve(fake)).toBe(fake);
    expect((fake as unknown as Record<string, unknown>)["then"]).toBeUndefined();
    void fake.count;
    // Spies and recorded calls stay off the enumerable keys: only the subclass's own field shows.
    expect(JSON.parse(JSON.stringify(fake))).toEqual({ prefix: "Hello" });
    expect(Object.keys(fake)).toEqual(["prefix"]);
  });

  it("returns an empty list for a method never recorded, and a copy otherwise", async () => {
    const fake = GreeterFake.with();
    expect(fake.calls("greet")).toEqual([]);
    await fake.greet("Ada");
    (fake.calls("greet") as string[]).push("tampered");
    expect(fake.calls("greet")).toEqual(["Ada"]);
  });

  it("names the class after the port", () => {
    expect(Fake.of(Greeter).name).toBe("GreeterFake");
  });

  it("records calls for a double with no port", () => {
    const double = new ClockDouble();
    double.tick(5);
    double.tick(10);
    expect(double.calls("tick")).toEqual([5, 10]);
    expect(double.calls("tock")).toEqual([]);
  });

  it("types record and calls by the port's method names and first arguments", () => {
    const fake = GreeterFake.with();
    expectTypeOf(fake.calls("greet")).toEqualTypeOf<readonly string[]>();
    // A reader shaped like the template's access-log matcher accepts the fake.
    const reader: { calls(name: "greet"): readonly string[] } = fake;
    expect(reader.calls("greet")).toEqual([]);
    // @ts-expect-error the first argument of greet is a string
    fake.record("greet", 1);
    // @ts-expect-error not a method of the port
    fake.calls("wave");
  });
});
