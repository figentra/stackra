/**
 * Stackra file contract:
 * Purpose: `DiscoveryService`, the platform binding an Explorer injects to find the instances whose class carries a
 *          class decorator, with the value the decorator was given, and the binding any class injects to read the
 *          contributions to an extension point it owns (`getAll(Base)`, the multi-binding).
 * Boundary: built by the container itself and global without a declaration; it reads the instances the container
 *           has built (every eager binding once an Explorer runs) and the decorator's own records, never
 *           reflect-metadata.
 * Runtime: isomorphic
 * Governing contract: ADR 0144 (Explorers) as amended by 0263; ADR 0294 (decisions 6 and 15); ADR 0457.
 */
import { Service } from "#core/bases/service.base";
import { DecoratorTarget } from "#core/enums/decorator-target.enum";
import type { Container } from "#core/services/container.service";
import type { AnyClass } from "#core/types/any-class.type";
import type { Decorator } from "#core/types/decorator.type";
import type { DiscoveredClass } from "#core/types/discovered-class.type";

/** Finds decorated instances among those the container built, and the contributions to an extension point. */
export class DiscoveryService extends Service {
  /** The container whose instances it reads. */
  private readonly container: Container;

  /**
   * @param container - the root container, which builds it.
   */
  constructor(container: Container) {
    super();
    this.container = container;
  }

  /**
   * Every built instance whose class (or an ancestor) carries `decorator`, in build order.
   *
   * @throws TypeError when `decorator` decorates fields or methods: those are read with `decorator.members(type)`.
   * @example
   * for (const { instance, className, options } of this.discovery.classesWith(AccessLogged)) { ... }
   */
  classesWith<V>(decorator: Decorator<V>): DiscoveredClass<V>[] {
    if (decorator.target !== DecoratorTarget.Class)
      throw new TypeError(`@${decorator.kind} decorates a ${decorator.target}, not a class`);
    return this.container.instances().flatMap((instance) => {
      const type = instance.constructor as AnyClass;
      const options = decorator.on(type);
      return options === undefined ? [] : [{ instance, className: type.name, options }];
    });
  }

  /**
   * Every booted class that extends `base`, in wiring order: what other modules contributed to the extension point
   * `base` stands for. See `Container.getAll`.
   *
   * @example
   * const verdicts = await Promise.all(this.discovery.getAll(CheckoutGuard).map((guard) => guard.check(cart)));
   */
  getAll<T extends object>(base: AnyClass<T>): T[] {
    return this.container.getAll(base);
  }
}
