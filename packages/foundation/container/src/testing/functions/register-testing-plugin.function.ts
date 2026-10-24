/**
 * Stackra file contract:
 * Purpose: `registerTestingPlugin`, the builder extension point: another package's testing setup adds chain methods
 *          to `TestingModuleBuilder` and members to `TestingApp`, so container never imports config, actions or
 *          integrations.
 * Boundary: installs builder methods on the builder's prototype and keeps the plugin for `compile()`. Registering the
 *           same plugin name again replaces it; a method another plugin or the builder already has is refused.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); the STA-348 registry row (builder extension point).
 */
import { TESTING_PLUGINS } from "#testing/constants/testing-plugins.constant";
import { TestingModuleBuilder } from "#testing/services/testing-module-builder.service";
import type { TestingPlugin } from "#testing/types/testing-plugin.type";

/**
 * Registers a testing-module plugin.
 *
 * @throws TypeError when a builder method name is taken by the builder or by another plugin.
 * @example
 * registerTestingPlugin({
 *   name: "@stackra/config",
 *   builder: {
 *     withConfig(this: TestingModuleBuilder, type: AnyClass, values: object) {
 *       return this.override(type, Object.assign(new (type as new () => object)(), values));
 *     },
 *   },
 * });
 */
export function registerTestingPlugin(plugin: TestingPlugin): void {
  const prototype = TestingModuleBuilder.prototype as unknown as Record<string, unknown>;
  const own = new Set(Object.keys(TESTING_PLUGINS.get(plugin.name)?.builder ?? {}));
  for (const method of Object.keys(plugin.builder ?? {}))
    if (method in prototype && !own.has(method))
      throw new TypeError(
        `${plugin.name} cannot add .${method}(): the testing module already has it`,
      );
  for (const method of own) Reflect.deleteProperty(prototype, method);
  for (const [method, value] of Object.entries(plugin.builder ?? {}))
    Object.defineProperty(prototype, method, { value, writable: true, configurable: true });
  TESTING_PLUGINS.set(plugin.name, plugin);
}
