/**
 * Stackra file contract:
 * Purpose: `createSlot`, the callable behind `ExtensionPoint.after()` and `.before()`: called as a method of its point,
 *          it finds its own property name, collects the slot's extensions (registered classes the connected app binds,
 *          and the app's inline implementers), sorts them by `order` and runs them as a value pipeline (`after`) or a
 *          chain of checks that may replace the arguments (`before`).
 * Boundary: internal to the point. The last argument is always the caller's context and is passed to every extension
 *           unchanged. A slot called detached from its point, or with registered extensions and no connected app, is a
 *           bug and throws. Extensions run in process, inside the caller's transaction (ADR 0265 decision 6).
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 23 and 25); ADR 0265 (decisions 1, 4 and 6).
 */
import { kindOf } from "@stackra/container";

import { EXTENSION_HOST } from "#core/constants/extension-host.constant";
import { EXTENSION_REGISTRY } from "#core/constants/extension-registry.constant";

/** One runnable implementer of a slot. */
type Handler = { readonly order: number; readonly handle: (...args: unknown[]) => unknown };

/** The own property of `point` that holds `slot`. */
function nameOf(point: object, slot: unknown): string {
  const entry = Object.entries(point).find(([, value]) => value === slot);
  if (entry === undefined)
    throw new TypeError(
      `${point.constructor.name}: an extension slot must be a property of its point`,
    );
  return entry[0];
}

/** The implementers of `point`'s slot `name`, in ascending order (registration order breaks ties). */
function handlersOf(point: object, name: string): Handler[] {
  const { resolver, inline } = EXTENSION_HOST;
  const rows = EXTENSION_REGISTRY.filter((row) => point instanceof row.point && row.slot === name);
  if (rows.length > 0 && resolver === undefined)
    throw new Error(
      `${point.constructor.name}.${name} has registered extensions but no app is connected: call connectExtensions(container) at boot`,
    );
  const handlers: Handler[] = [];
  for (const row of rows)
    if (resolver?.has(row.extension)) {
      const instance = resolver.get(row.extension) as unknown as {
        handle(...args: unknown[]): unknown;
      };
      const order =
        row.order ?? (kindOf(row.extension)?.options["order"] as number | undefined) ?? 0;
      handlers.push({ order, handle: (...args) => instance.handle(...args) });
    }
  for (const extension of inline)
    if (point instanceof extension.point && extension.slot === name)
      handlers.push({
        order: extension.order,
        handle: extension.handle as (...args: unknown[]) => unknown,
      });
  return handlers.sort((left, right) => left.order - right.order);
}

/**
 * Makes one slot of kind `kind`.
 *
 * @returns a function to store as a point's property; its static types come from `ExtensionPoint.after` or `.before`.
 * @example
 * readonly adjustTotals = createSlot("after") as AfterSlot<OrderTotals, [draft: OrderDraft]>;
 */
export function createSlot(kind: "after" | "before"): (...args: unknown[]) => Promise<unknown> {
  async function slot(this: unknown, ...args: unknown[]): Promise<unknown> {
    if (typeof this !== "object" || this === null)
      throw new TypeError("Call an extension slot as a method of its point: this.point.slot(...)");
    const name = nameOf(this, slot);
    const ctx = args.at(-1);
    const rest = args.slice(0, -1);
    const handlers = handlersOf(this, name);
    if (kind === "after") {
      let [value] = rest;
      const extra = rest.slice(1);
      for (const handler of handlers) value = await handler.handle(value, ...extra, ctx);
      return value;
    }
    let current = rest;
    for (const handler of handlers) {
      const replaced = await handler.handle(...current, ctx);
      if (replaced === undefined) continue;
      if (!Array.isArray(replaced) || replaced.length !== current.length)
        throw new TypeError(
          `${this.constructor.name}.${name}: a before extension returns its arguments as a tuple of ${current.length}, or nothing`,
        );
      current = replaced;
    }
    return current;
  }
  Object.defineProperty(slot, "~slot", { value: kind });
  return slot;
}
