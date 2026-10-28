/**
 * Stackra file contract:
 * Purpose: `upstreamTransformer`, the Babel transformer Metro would use without gen: Expo's
 *          (`@expo/metro-config/babel-transformer`) when the app has it, React Native's
 *          (`@react-native/metro-babel-transformer`) otherwise, resolved from the app's project root.
 * Boundary: resolves and loads once per project root; gen depends on neither package, the app does.
 * Runtime: node
 * Governing contract: ADR 0127 2026-10-24 note (the metro-transformer tool hook); ADR 0305 (rule 40: Metro).
 */
import { createRequire } from "node:module";
import { join } from "node:path";

import type { MetroTransformParams } from "#metro-transformer/types/metro-transform-params.type";

/** A Metro Babel transformer. */
interface BabelTransformer {
  transform: (params: MetroTransformParams) => unknown;
  getCacheKey?: () => string;
}

/** The candidates, in order of preference. */
const CANDIDATES = [
  "@expo/metro-config/babel-transformer",
  "@react-native/metro-babel-transformer",
];

/** The loaded transformer per project root. */
const LOADED = new Map<string, BabelTransformer>();

/**
 * The upstream transformer for `projectRoot`.
 *
 * @param projectRoot - the app's root, from Metro's options.
 * @throws Error when neither transformer is installed in the app.
 * @example
 * upstreamTransformer("/repo/apps/mobile").transform(params);
 */
export function upstreamTransformer(projectRoot: string): BabelTransformer {
  const loaded = LOADED.get(projectRoot);
  if (loaded !== undefined) return loaded;
  const require = createRequire(join(projectRoot, "package.json"));
  for (const candidate of CANDIDATES) {
    let path: string;
    try {
      path = require.resolve(candidate);
    } catch {
      continue;
    }
    const transformer = require(path) as BabelTransformer;
    LOADED.set(projectRoot, transformer);
    return transformer;
  }
  throw new Error(
    `no Metro Babel transformer in ${projectRoot}: install @expo/metro-config or @react-native/metro-babel-transformer`,
  );
}
