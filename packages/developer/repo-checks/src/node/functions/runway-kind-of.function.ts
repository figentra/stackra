/**
 * Stackra file contract:
 * Purpose: `runwayKindOf(path)`, the runway kind a `runway.yaml` at `path` is read as: root at the repository root, app at
 *          an app or Worker member root (or a scaffold app template), service at a service member root (or template).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0296.
 */

/**
 * The runway kind of the file at `path`, or undefined where no runway file belongs.
 *
 * @param path - repository-relative.
 * @example
 * runwayKindOf("apps/web/runway.yaml"); // "app"
 */
export function runwayKindOf(path: string): "root" | "app" | "service" | undefined {
  if (path === "runway.yaml") return "root";
  if (/^(?:apps|workers|tools\/scaffold\/templates\/apps)\/[^/]+\/runway\.yaml$/.test(path))
    return "app";
  if (/^(?:services|tools\/scaffold\/templates\/services)\/[^/]+\/runway\.yaml$/.test(path))
    return "service";
  return undefined;
}
