/**
 * Stackra file contract:
 * Purpose: `Fake`, the base of every `*.fake.ts` test double: call recording (`record`, `calls`), and `Fake.of(Port)`,
 *          a concrete class of an abstract port whose unimplemented methods are spies.
 * Boundary: generic; the fakes of real ports live in each owning package's `./testing` entry (ADR 0269 decision 3).
 *           A spy is created on first read of a lowerCamel name the instance lacks, so it never needs the port's
 *           type at runtime.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 2); ADR 0266 (decision 2: a fake per capability); ADR 0305 (rule 3: a kind
 *                     base is named after its kind).
 */
import { vi } from "vitest";
import type { FakeConstructor } from "#core/types/fake-constructor.type";

/**
 * Extend `Fake.of(Port)` for a fake of a port, or `Fake` for a double with no port. A subclass implements the methods
 * its tests need and calls `this.record(name, value)` in each; every other method of the port is a `vi.fn()` spy.
 * Statics such as `static with(...)` go on the subclass. TypeScript still asks for every abstract method of the port:
 * one left to its spy is written `declare count: Port["count"];`, which emits nothing.
 *
 * @example
 * class MembersFake extends Fake.of(LoyaltyMembers) {
 *   async isMember(id: MemberId): Promise<boolean> {
 *     this.record("isMember", id);
 *     return true;
 *   }
 * }
 */
export abstract class Fake {
  /** Recorded values per instance, kept off the instance so equality checks and printing ignore them. */
  static readonly #recorded = new WeakMap<object, Map<string, unknown[]>>();

  /** The shape of a port method name, and of nothing a runtime probes for (`$$typeof`, `@@iterator`). */
  static readonly #methodName = /^[a-z][A-Za-z0-9]*$/;

  /** Method-shaped names that promises, JSON, matchers and printers probe for; spying them would break those. */
  static readonly #probed: ReadonlySet<string> = new Set([
    "then",
    "toJSON",
    "asymmetricMatch",
    "nodeType",
    "tagName",
    "inspect",
  ]);

  /**
   * A concrete class of `port`. Its instances are the port (`instanceof` holds, so a container override accepts
   * them), record calls, and answer every method no class in the chain implements with a spy named
   * `<Port>.<method>`, created on first read and kept for the instance's life.
   *
   * @param port - the abstract class to fake; its constructor takes no argument.
   * @returns the class to extend, named `<Port>Fake`.
   */
  static of<T extends object>(port: abstract new () => T): FakeConstructor<T> {
    const Port = port as unknown as new () => object;
    const spyMissing: NonNullable<ProxyHandler<object>["get"]> = (target, property, receiver) => {
      if (
        typeof property === "string" &&
        !(property in target) &&
        Fake.#methodName.test(property) &&
        !Fake.#probed.has(property)
      )
        Object.defineProperty(target, property, {
          value: vi.fn().mockName(`${port.name}.${property}`),
          writable: true,
          configurable: true,
          enumerable: false,
        });
      return Reflect.get(target, property, receiver);
    };
    const PortFake = class extends Port {
      constructor() {
        super();
        // The proxy is `this` for every subclass too, so their fields and methods sit on the same target.
        return new Proxy<this>(this, { get: spyMissing });
      }

      record(name: string, value: unknown): void {
        Fake.#record(this, name, value);
      }

      calls(name: string): readonly unknown[] {
        return Fake.#calls(this, name);
      }
    };
    Object.defineProperty(PortFake, "name", { value: `${port.name}Fake` });
    return PortFake as unknown as FakeConstructor<T>;
  }

  /**
   * Records one call of `name` with its first argument, in order.
   *
   * @param name - the method that was called.
   * @param value - its first argument.
   */
  record(name: string, value: unknown): void {
    Fake.#record(this, name, value);
  }

  /**
   * The values recorded for `name`, oldest first; empty when it was never recorded.
   *
   * @param name - the method to read.
   */
  calls(name: string): readonly unknown[] {
    return Fake.#calls(this, name);
  }

  /** Appends `value` to the record of `name` on `fake`. */
  static #record(fake: object, name: string, value: unknown): void {
    let byName = Fake.#recorded.get(fake);
    if (!byName) Fake.#recorded.set(fake, (byName = new Map()));
    const values = byName.get(name);
    if (values) values.push(value);
    else byName.set(name, [value]);
  }

  /** A copy of the record of `name` on `fake`, so a caller cannot rewrite history. */
  static #calls(fake: object, name: string): readonly unknown[] {
    return [...(Fake.#recorded.get(fake)?.get(name) ?? [])];
  }
}
