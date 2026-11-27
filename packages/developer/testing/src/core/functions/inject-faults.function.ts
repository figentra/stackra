/**
 * Stackra file contract:
 * Purpose: `injectFaults(target, rules)`, the fault-injection tier's provider and store fault: wraps any object (a
 *          port's driver, a provider client, a gateway fake) so the calls the rules name fail, either before the target
 *          is reached or after it acted with the answer lost, and records every call. A test binds the wrapped target
 *          in place of the real one and proves an at-least-once path loses nothing and does nothing twice.
 * Boundary: generic (ADR 0269 decision 2): no workspace import, no domain type. A `Proxy` over the target: it keeps
 *           the target's prototype (so `instanceof` and the DI token still match) and runs every method on the target
 *           itself, so a call the target makes to its own methods is neither recorded nor faulted. Faults are for
 *           methods that answer a promise (ports, providers): a `before` fault answers a rejected promise; an `after`
 *           fault rejects once the target's promise settles (and throws at once when the method answered a plain
 *           value). A rule naming a method the target lacks throws at once, so a typo never passes silently.
 * Runtime: isomorphic
 * Governing contract: ADR 0182 (decision 4: fault injection; decisions 1 and 3: the tier runs in the unit and
 *                     integration tiers); ADR 0269 (decision 2: generic kit).
 */
import { InjectedFaultError } from "#core/errors/injected-fault.error";
import type { FaultCall } from "#core/types/fault-call.type";
import type { FaultInjection } from "#core/types/fault-injection.type";
import type { FaultRule } from "#core/types/fault-rule.type";
import type { FaultTiming } from "#core/types/fault-timing.type";

/** Whether call number `call` is one of `calls` (a rule's default is the first call). */
function matches(calls: FaultRule["calls"], call: number): boolean {
  if (calls === undefined) return call === 1;
  if (calls === "every") return true;
  return typeof calls === "number" ? calls === call : calls.includes(call);
}

/**
 * Checks each rule names a method of `target` and gives only whole call numbers from 1.
 *
 * @throws TypeError on a rule that names no method of the target, or a call number that is not a whole number from 1.
 */
function assertRules(target: object, rules: readonly FaultRule[]): void {
  for (const rule of rules) {
    if (typeof Reflect.get(target, rule.method) !== "function")
      throw new TypeError(`injectFaults: the target has no method "${rule.method}"`);
    const { calls } = rule;
    const numbers = calls === undefined || calls === "every" ? [] : [calls].flat();
    for (const number of numbers)
      if (!Number.isInteger(number) || number < 1)
        throw new TypeError(
          `injectFaults: call numbers of "${rule.method}" are whole numbers from 1, got ${number}`,
        );
  }
}

/** Whether `value` is a promise-like answer. */
function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === "object" || typeof value === "function") &&
    value !== null &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

/**
 * Wraps `target` so the calls `rules` name fail, and records every call.
 *
 * @param target - the object the code under test calls (a driver, a provider client, a fake).
 * @param rules - which calls fail; the first rule that matches a call wins.
 * @returns the wrapped target, the calls it received and `heal()`.
 * @throws TypeError when a rule names a method the target lacks, or a call number that is not a whole number from 1.
 * @example
 * // the store loses the answer of the first `remove`: the row is gone, the worker cannot tell
 * const store = injectFaults(new MemoryQueueDriver(), [{ method: "remove", when: "after" }]);
 * const worker = new QueueWorkerService(store.target, clock);
 * expect(store.faults()).toMatchObject([{ method: "remove", call: 1, fault: "after" }]);
 */
export function injectFaults<T extends object>(
  target: T,
  rules: readonly FaultRule<keyof T & string>[],
): FaultInjection<T> {
  assertRules(target, rules);
  const calls: FaultCall[] = [];
  const counts = new Map<string, number>();
  let healed = false;

  /** The method `name` of the target, recording each call and failing the ones a rule names. */
  const wrap =
    (name: string, method: (...args: unknown[]) => unknown) =>
    (...args: unknown[]): unknown => {
      const number = (counts.get(name) ?? 0) + 1;
      counts.set(name, number);
      const rule = healed
        ? undefined
        : rules.find((each) => each.method === name && matches(each.calls, number));
      const fault: FaultTiming | undefined =
        rule === undefined ? undefined : (rule.when ?? "before");
      const call: FaultCall = Object.freeze({
        method: name,
        call: number,
        args: Object.freeze([...args]),
        fault,
      });
      calls.push(call);
      if (rule === undefined || fault === undefined) return method.apply(target, args);
      const error = () => rule.error?.(call) ?? new InjectedFaultError(name, number, fault);
      if (fault === "before") return Promise.reject(error());
      const answer = method.apply(target, args);
      if (!isThenable(answer)) throw error();
      return Promise.resolve(answer).then(() => {
        throw error();
      });
    };

  const proxy = new Proxy(target, {
    get(object, property) {
      const value: unknown = Reflect.get(object, property, object);
      if (typeof property !== "string" || property === "constructor" || typeof value !== "function")
        return value;
      return wrap(property, value as (...args: unknown[]) => unknown);
    },
  });

  return Object.freeze({
    target: proxy,
    calls,
    callsOf: (method: keyof T & string) => calls.filter((call) => call.method === method),
    faults: () => calls.filter((call) => call.fault !== undefined),
    heal: () => {
      healed = true;
    },
  });
}
