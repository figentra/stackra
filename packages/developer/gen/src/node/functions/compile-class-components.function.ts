/**
 * Stackra file contract:
 * Purpose: `compileClassComponents`, one file through the class-component pass: the source is parsed as TypeScript
 *          (with JSX for `.tsx`/`.jsx`), the plugin compiles each component class, and the output stays TypeScript
 *          with a source map back to the class, so Vite, Metro, tsdown and gen's emitter all run the same pass.
 * Boundary: a file that does not import from `#stackra/ui` is skipped before parsing (undefined), so the pass costs
 *           nothing elsewhere. No Babel config file is read; only this plugin runs. A refusal throws Babel's code
 *           frame error, which every host shows as is.
 * Runtime: node
 * Governing contract: ADR 0305 (rules 38 to 40: gen compiles class components; Vite, Metro and tsdown integration);
 *                     the STA-402 spike (one Babel pass, maps composed by the host).
 */
import { transformAsync } from "@babel/core";

import { COMPONENT_MODULE } from "#node/constants/component-module.constant";
import { classComponentsPlugin } from "#node/functions/class-components-plugin.function";

/**
 * The compiled source of `code`, or undefined when the file has no component class import.
 *
 * @param code - the file's source.
 * @param filename - its path, for the parser (JSX by extension), source maps and error frames.
 * @param options - `retainLines` keeps every output line on its source line (Metro, which maps by line).
 * @throws Error a Babel code frame error when a component class uses an unsupported form.
 * @example
 * const out = await compileClassComponents(source, "src/components/counter/counter.tsx");
 * out?.code; // "export function Counter(props: CounterProps) { const [count, setCount] = useState(...) ... }"
 */
export async function compileClassComponents(
  code: string,
  filename: string,
  options: { readonly retainLines?: boolean } = {},
): Promise<{ readonly code: string; readonly map: unknown } | undefined> {
  if (!code.includes(COMPONENT_MODULE)) return undefined;
  const plugins: ("jsx" | "typescript")[] = /\.[jt]sx$/.test(filename)
    ? ["jsx", "typescript"]
    : ["typescript"];
  const result = await transformAsync(code, {
    filename,
    babelrc: false,
    configFile: false,
    sourceMaps: true,
    retainLines: options.retainLines === true,
    parserOpts: { plugins },
    plugins: [classComponentsPlugin],
  });
  if (result?.code === undefined || result.code === null) return undefined;
  return { code: result.code, map: result.map ?? null };
}
