/**
 * Stackra file contract:
 * Purpose: `checkSurfaces(root, appMembers)`, the rules of the root runway's `surfaces`, `mobile` and `assets` blocks
 *          that a JSON Schema cannot state: the ops surface takes only `contributes` and no other surface does; only
 *          landing takes `content`; every other surface names its shell line; every content, assets and store path
 *          sits under the assets root; no two surfaces share a host; a mobile app's iOS bundle id and Android package
 *          end in `.<product>.<app>`; and an `app` reference names an existing app member.
 * Boundary: pure; returns every failure instead of throwing, for `stackra validate` to print. The app member keys are
 *           the caller's (`apps/<key>` folders); runway does not read the workspace. Whether a template line offers a
 *           capability, and whether the edge serves a shell line, are the template build's and the registry's checks.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 3, enforcement: paths outside the assets tree are refused), ADR 0436
 *                     (decisions 3, 9 and 11, enforcement), ADR 0439 (decision 6, enforcement), ADR 0440 (decision 2).
 */
import { DEFAULT_ASSETS_ROOT } from "#core/constants/default-assets-root.constant";
import { SurfaceKind } from "#core/enums/surface-kind.enum";
import type { RootRunway } from "#core/types/root-runway.type";
import type { SurfaceIssue } from "#core/types/surface-issue.type";

/**
 * Every surface, mobile and assets failure of `root`; `[]` when all hold.
 *
 * @param root - the parsed root runway.
 * @param appMembers - the app member keys of the repository (`till` for `apps/till`).
 * @example
 * checkSurfaces(root, []);
 * // [{ path: "surfaces.ops", code: "ops_contributes_only", message: "…" }]
 */
export function checkSurfaces(root: RootRunway, appMembers: readonly string[]): SurfaceIssue[] {
  const assetsRoot = root.assets?.root ?? DEFAULT_ASSETS_ROOT;
  const known = new Set(appMembers);
  const hosts = new Map<string, string>();
  const issues: SurfaceIssue[] = [];
  const underAssets = (path: string, at: string) => {
    if (path !== assetsRoot && !path.startsWith(`${assetsRoot}/`))
      issues.push({
        path: at,
        code: "path_outside_assets",
        message: `${at} is "${path}", outside the assets tree "${assetsRoot}"`,
      });
  };
  const memberExists = (member: string | undefined, at: string) => {
    if (member !== undefined && !known.has(member))
      issues.push({
        path: at,
        code: "app_member_unknown",
        message: `${at} names "${member}", which is not an app member (apps/${member})`,
      });
  };

  for (const [kind, surface] of Object.entries(root.surfaces ?? {})) {
    if (surface === undefined) continue;
    const at = `surfaces.${kind}`;
    if (kind === SurfaceKind.Ops) {
      const extra = (["shell", "packages", "content", "host", "app"] as const).filter(
        (key) => surface[key] !== undefined,
      );
      if (extra.length > 0)
        issues.push({
          path: at,
          code: "ops_contributes_only",
          message: `${at} takes only contributes (declarations reviewed into the OS ops release), not ${extra.join(", ")}`,
        });
      continue;
    }
    if (surface.contributes !== undefined)
      issues.push({
        path: `${at}.contributes`,
        code: "contributes_outside_ops",
        message: `${at}.contributes is for the ops surface only: list the package in ${at}.packages`,
      });
    if (surface.shell === undefined)
      issues.push({
        path: `${at}.shell`,
        code: "shell_missing",
        message: `${at} names no shell line, such as os/${kind}@1`,
      });
    if (surface.content !== undefined) {
      if (kind === SurfaceKind.Landing) underAssets(surface.content, `${at}.content`);
      else
        issues.push({
          path: `${at}.content`,
          code: "content_outside_landing",
          message: `${at}.content is for the landing surface only`,
        });
    }
    if (surface.host !== undefined) {
      const first = hosts.get(surface.host);
      if (first === undefined) hosts.set(surface.host, at);
      else
        issues.push({
          path: `${at}.host`,
          code: "host_duplicate",
          message: `${at}.host "${surface.host}" is also ${first}.host`,
        });
    }
    memberExists(surface.app?.member, `${at}.app.member`);
  }

  for (const [key, app] of Object.entries(root.mobile ?? {})) {
    const at = `mobile.${key}`;
    underAssets(app.assets, `${at}.assets`);
    underAssets(app.store, `${at}.store`);
    const suffix = root.product === undefined ? undefined : `.${root.product.key}.${key}`;
    const ids = [
      [`${at}.identity.ios.bundleId`, app.identity.ios?.bundleId],
      [`${at}.identity.android.package`, app.identity.android?.package],
    ] as const;
    for (const [path, id] of ids) {
      if (suffix !== undefined && id !== undefined && !id.endsWith(suffix))
        issues.push({
          path,
          code: "app_id_pattern",
          message: `${path} is "${id}"; an app id ends in "${suffix}" (<prefix>.<product>.<app>)`,
        });
    }
    memberExists(app.app?.member, `${at}.app.member`);
  }
  return issues;
}
