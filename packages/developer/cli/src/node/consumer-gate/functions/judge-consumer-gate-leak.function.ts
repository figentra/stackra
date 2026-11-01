/**
 * Stackra file contract:
 * Purpose: `judgeConsumerGateLeak({ core, resolved, missingSources })`, the leak verdict of a pack-mode install: one
 *          finding for each resolved path (realpath) inside the core tree, and one for each `@stackra/source`
 *          target that points at a `./src/` file the installed package does not hold.
 * Boundary: pure; the findings make the `leak` step fail, and no allow entry can excuse it.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */

/**
 * The findings, empty when nothing leaks.
 *
 * @param input - the core root, the resolved paths and the `package: ./src/file` source targets that are absent.
 * @example
 * judgeConsumerGateLeak({ core: "/core", resolved: ["/core/packages/a/dist/x.js"], missingSources: [] });
 * // ["resolves into the core tree: /core/packages/a/dist/x.js"]
 */
export function judgeConsumerGateLeak(input: {
  readonly core: string;
  readonly resolved: readonly string[];
  readonly missingSources: readonly string[];
}): string[] {
  const inside = (path: string): boolean =>
    path === input.core || path.startsWith(`${input.core}/`);
  return [
    ...input.resolved
      .filter((path) => inside(path))
      .map((path) => `resolves into the core tree: ${path}`),
    ...input.missingSources.map(
      (source) => `@stackra/source points at a file not in the tarball: ${source}`,
    ),
  ];
}
