/**
 * Stackra file contract:
 * Purpose: `AccessLogExplorer`, the runtime half of `@AccessLogged`: at bootstrap it finds every built instance whose
 *          class carries the facet, through the container's `DiscoveryService`, and wraps each method the class
 *          declares, so every call writes one access record.
 * Boundary: registration only; no global registry at import time. The decorator is its own metadata key, so the
 *           Explorer and gen look up the same thing, and the conformance test proves they agree. Inherited methods are
 *           not wrapped. The running call's id and actor come from `RequestContext`, which throws outside an action or
 *           query call (a missing context is a bug, never an anonymous read). An async method resolves only once its
 *           record is written, so for a class that fails closed (ADR 0409) a lost record withholds the result with
 *           `access_log_write_failed`. A synchronous method stays synchronous: its record is written without being
 *           awaited, so it cannot be held back (its failure is still logged); a fail-closed read is written async.
 * Runtime: node
 * Governing contract: ADR 0144 as amended by 0294 (Explorers, `src/<entry>/<pkg>.explorer.ts`); ADR 0294 (decisions 6
 *                     and 15); ADR 0212 (decision 5); ADR 0005 (no reflect-metadata); ADR 0409 (fail closed).
 */
import type { RequestContext } from "@stackra/actions";
import { Explorer } from "@stackra/container";
import type { DiscoveryService } from "@stackra/container";

import { AccessLogged } from "#core/decorators/access-logged.decorator";
import type { AccessLogService } from "#core/services/access-log.service";

/** A method of a logged instance, as the wrapper calls it. */
type Method = (...args: unknown[]) => unknown;

/** The methods the instance's own class declares, in source order: no getter, no constructor. */
function declaredMethods(instance: object): [name: string, method: Method][] {
  const prototype = Object.getPrototypeOf(instance) as object;
  return Object.getOwnPropertyNames(prototype).flatMap((name): [string, Method][] => {
    const value: unknown = Object.getOwnPropertyDescriptor(prototype, name)?.value;
    return name !== "constructor" && typeof value === "function" ? [[name, value as Method]] : [];
  });
}

/**
 * Wraps the declared methods of every `@AccessLogged` instance, once per container.
 *
 * @example
 * await app.get(CustomerReads).view("cus_1"); // one record: CustomerReads.view, subjects ["cus_1"]
 */
export class AccessLogExplorer extends Explorer {
  /** Lists the instances whose class carries the facet, with its options. */
  private readonly discovery: DiscoveryService;

  /** Writes each record; rejects only for a class that fails closed. */
  private readonly log: AccessLogService;

  /** The running call's id and actor. */
  private readonly request: RequestContext;

  /**
   * @param discovery - lists the instances whose class carries the facet.
   * @param log - writes each record.
   * @param request - the running call's context, read when a wrapped method is called.
   */
  constructor(discovery: DiscoveryService, log: AccessLogService, request: RequestContext) {
    super();
    this.discovery = discovery;
    this.log = log;
    this.request = request;
  }

  /**
   * Wraps each declared method so its record is written once the call settles; a call that throws is still
   * recorded, against its arguments only.
   */
  onApplicationBootstrap(): void {
    for (const { instance, className, options } of this.discovery.classesWith(AccessLogged)) {
      const slots = instance as Record<string, Method>;
      for (const [method, declared] of declaredMethods(instance)) {
        const original = declared.bind(instance);
        const target = `${className}.${method}`;
        slots[method] = (...args: unknown[]): unknown => {
          const { callId, actor } = this.request.current();
          const write = (values: readonly unknown[]) =>
            this.log.record(callId, actor, target, options, values);
          let result: unknown;
          try {
            result = original(...args);
          } catch (error) {
            void write(args).catch(() => undefined);
            throw error;
          }
          if (!(result instanceof Promise)) {
            // The value is already returned, so only an async method can be held back; the failure is logged.
            void write([...args, result]).catch(() => undefined);
            return result;
          }
          return result.then(
            async (value: unknown) => {
              await write([...args, value]); // a fail-closed class rejects here: the value is not served
              return value;
            },
            async (error: unknown) => {
              await write(args).catch(() => undefined); // the call's own error stands
              throw error;
            },
          );
        };
      }
    }
  }

  /** What is wrapped, as `<Class>.<method>`; the conformance test compares it with gen's list. */
  targets(): readonly string[] {
    return this.discovery
      .classesWith(AccessLogged)
      .flatMap(({ instance, className }) =>
        declaredMethods(instance).map(([method]) => `${className}.${method}`),
      );
  }
}
