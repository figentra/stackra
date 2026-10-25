/**
 * Stackra file contract:
 * Purpose: `corePlugins`, the plugins every Stackra Vite build runs: gen's class-component pass (first, so React, the
 *          React Router plugin and Fast Refresh see plain function components), `#stackra/*` served from gen's files
 *          and the `.server` import refusal.
 * Boundary: wires gen's pass and never reimplements it (registry A14: gen ships the pass, this package wires it). The
 *           pass is added only when the given plugins do not already hold it, so a generated config that lists
 *           `classComponents()` itself runs it once.
 * Runtime: node
 * Governing contract: ADR 0305 (rules 38 to 40: the class-component compiler in Vite), ADR 0261 (decision 4).
 */
import { classComponents } from "@stackra/gen/node";
import type { Plugin, PluginOption, Rolldown } from "vite";

import { generatedModulesPlugin } from "#core/functions/generated-modules-plugin.function";
import { serverOnlyPlugin } from "#core/functions/server-only-plugin.function";

/** The names of the plugins in `options`, nested arrays included; pending (promised) plugins are not awaited. */
function namesOf(options: readonly PluginOption[]): string[] {
  return options.flatMap((option): string[] => {
    if (Array.isArray(option)) return namesOf(option);
    if (typeof option === "object" && option !== null && "name" in option) return [option.name];
    return [];
  });
}

/**
 * The preset's own plugins.
 *
 * @param existing - plugins the config already runs, checked for the class-component pass.
 * @example
 * corePlugins(); // [stackra:class-components, stackra:generated-modules, stackra:server-only]
 * corePlugins([classComponents()]); // [stackra:generated-modules, stackra:server-only]
 */
export function corePlugins(existing: readonly PluginOption[] = []): Plugin[] {
  const pass = classComponents();
  const plugins: Plugin[] = [];
  if (!namesOf(existing).includes(pass.name)) {
    plugins.push({
      name: pass.name,
      enforce: pass.enforce,
      // gen types the map as `unknown` to stay free of Vite; it is Babel's source map, which Vite accepts
      transform: (code, id) => pass.transform(code, id) as Promise<Rolldown.TransformResult>,
    });
  }
  plugins.push(generatedModulesPlugin(), serverOnlyPlugin());
  return plugins;
}
