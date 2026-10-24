/**
 * Stackra file contract:
 * Purpose: `transform`, the Metro Babel transformer gen ships (`babelTransformerPath` in the generated Metro config):
 *          the class-component pass first, on each `.tsx`/`.jsx` file with a `#stackra/ui` import, then Metro's
 *          upstream transformer on the result, so Expo's preset and the React Compiler only ever see functions.
 * Boundary: the pass keeps every line where it was (`retainLines`), so Metro's line-based maps and stacks still point
 *           at the class; every other file goes to the upstream transformer unchanged.
 * Runtime: node
 * Governing contract: ADR 0127 2026-10-24 note (`@stackra/gen/metro-transformer`); ADR 0305 (rules 38 and 40).
 */
import { compileClassComponents } from "#node/functions/compile-class-components.function";
import { upstreamTransformer } from "#metro-transformer/functions/upstream-transformer.function";
import type { MetroTransformParams } from "#metro-transformer/types/metro-transform-params.type";

/**
 * Transforms one file for Metro.
 *
 * @param params - what Metro passes.
 * @returns what the upstream transformer returns (`{ ast, metadata }`).
 * @throws Error a Babel code frame error when a component class uses an unsupported form.
 * @example
 * config.transformer.babelTransformerPath = require.resolve("@stackra/gen/metro-transformer");
 */
export async function transform(params: MetroTransformParams): Promise<unknown> {
  const upstream = upstreamTransformer(params.options.projectRoot);
  const compiled = /\.[jt]sx$/.test(params.filename)
    ? await compileClassComponents(params.src, params.filename, { retainLines: true })
    : undefined;
  return upstream.transform(compiled === undefined ? params : { ...params, src: compiled.code });
}
