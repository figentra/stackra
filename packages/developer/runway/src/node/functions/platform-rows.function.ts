/**
 * Stackra file contract:
 * Purpose: `platformRows(root, environment, options)`, the platform rows a product's root runway puts in the edge KV
 *          copy for one environment: a `host:<hostname>` row for every host of every web surface (product, surface,
 *          home region, status, realm and the surface's canonical host, D2), and the app-link files of every mobile
 *          app on its linked hosts (`wellknown:<host>:apple-app-site-association` and `wellknown:<host>:assetlinks.json`).
 * Boundary: pure; answers rows as KV key → JSON text and writes nothing. A host name is relative to the environment's
 *           `domains.zone` (`console.mezzora` → `console.mezzora.figentra.com`, D9) unless it already ends in that
 *           zone or ends in `.` (a product's own domain, `mezzora.com.`). Scope rows are never built here: they are
 *           the edge projector's. Status and realm come from `EDGE_PUBLISH_SETTINGS`.
 * Runtime: node
 * Governing contract: ADR 0437 (the KV copy); app-shells 5.1, 5.3 and 8.3; owner decisions D2 (two hosts, one
 *                     canonical) and D9 (host pattern); ADR 0439 (app links).
 */
import { EdgeKvPrefix } from "@stackra/app/contracts";

import type { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import type { RootRunway } from "#core/types/root-runway.type";
import type { RunwayIssue } from "#core/types/runway-issue.type";
import { EDGE_PUBLISH_SETTINGS } from "#node/constants/edge-publish-settings.constant";
import type { AppLinkKeys } from "#node/types/app-link-keys.type";
import type { EdgeHostRow } from "#node/types/edge-host-row.type";

/** A lower-case DNS name of two labels or more. */
const HOSTNAME =
  /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

/** An Apple team id. */
const TEAM_ID = /^[A-Z0-9]{10}$/;

/** The host `name` resolves to under `zone`, or `undefined` when it cannot. */
function resolveHost(name: string, zone: string | undefined): string | undefined {
  const host = name.endsWith(".")
    ? name.slice(0, -1)
    : zone === undefined
      ? undefined
      : name === zone || name.endsWith(`.${zone}`)
        ? name
        : `${name}.${zone}`;
  return host !== undefined && HOSTNAME.test(host) ? host : undefined;
}

/**
 * The platform rows, KV key → JSON text: hosts first, then well-known files.
 *
 * @param options.region - the home region; the environment's first region when absent.
 * @throws RunwayInvalidError listing every host, region or app-link key that cannot be resolved.
 * @example
 * for (const [key, value] of Object.entries(platformRows(root, "production", {}))) await kv.put(key, value);
 */
export function platformRows(
  root: RootRunway,
  environment: RunwayEnvironment,
  options: { readonly region?: string | undefined; readonly appLinks?: AppLinkKeys | undefined },
): Record<string, string> {
  const issues: RunwayIssue[] = [];
  const product = root.product?.key;
  if (product === undefined) issues.push({ path: "product.key", message: "Name the product" });
  const env = root.environments[environment];
  const zone = env?.domains?.zone;
  const region = options.region ?? env?.regions?.[0];
  if (region === undefined)
    issues.push({
      path: `environments.${environment}.regions`,
      message: "Name the region platform hosts send API calls to",
    });
  const host = (name: string, path: string): string => {
    const resolved = resolveHost(name, zone);
    if (resolved === undefined)
      issues.push({
        path,
        message:
          zone === undefined && !name.endsWith(".")
            ? `"${name}" is relative, and environments.${environment}.domains.zone is unset`
            : `"${name}" is not a host name`,
      });
    return resolved ?? name;
  };

  const rows: Record<string, string> = {};
  const { hostStatus, defaultRealm, realms } = EDGE_PUBLISH_SETTINGS;
  for (const surface of Object.keys(root.surfaces ?? {})) {
    const entry = surface === "ops" ? undefined : root.surfaces?.[surface];
    if (entry === undefined) continue;
    const at = `surfaces.${surface}`;
    const names = [
      ...(entry.host === undefined
        ? []
        : [{ name: entry.host, path: `${at}.host`, canonical: false }]),
      ...(entry.hosts ?? []).map((item, index) => ({
        name: item.host,
        path: `${at}.hosts.${index}.host`,
        canonical: item.canonical === true,
      })),
    ].map((item) => ({ ...item, host: host(item.name, item.path) }));
    const canonical = (names.find((item) => item.canonical) ?? names[0])?.host;
    for (const item of names) {
      const row: EdgeHostRow = {
        product: product ?? "",
        surface,
        region: region ?? "",
        status: hostStatus,
        realm: realms[surface] ?? defaultRealm,
        canonical: canonical ?? item.host,
      };
      rows[`${EdgeKvPrefix.Host}:${item.host}`] = JSON.stringify(row);
    }
  }

  const apple = new Map<string, string[]>();
  const android = new Map<string, unknown[]>();
  for (const [app, entry] of Object.entries(root.mobile ?? {})) {
    const identity = entry.identity;
    const at = `mobile.${app}.identity`;
    const links = (identity?.links ?? []).map((name, index) => host(name, `${at}.links.${index}`));
    if (links.length === 0) continue;
    const bundleId = identity?.ios?.bundleId;
    if (bundleId !== undefined) {
      const team = identity?.ios?.team;
      const teamId =
        team === undefined
          ? undefined
          : TEAM_ID.test(team)
            ? team
            : options.appLinks?.appleTeams?.[team];
      if (teamId === undefined)
        issues.push({
          path: `${at}.ios.team`,
          message: `No Apple team id for "${team ?? ""}": pass it in appLinks.appleTeams`,
        });
      else
        for (const link of links)
          apple.set(link, [...(apple.get(link) ?? []), `${teamId}.${bundleId}`]);
    }
    const pkg = identity?.android?.package;
    if (pkg !== undefined) {
      const certificates = options.appLinks?.androidCertificates?.[app] ?? [];
      if (certificates.length === 0)
        issues.push({
          path: `${at}.android.package`,
          message: `No signing certificate fingerprint for ${app}: pass it in appLinks.androidCertificates`,
        });
      else
        for (const link of links)
          android.set(link, [
            ...(android.get(link) ?? []),
            {
              relation: ["delegate_permission/common.handle_all_urls"],
              target: {
                namespace: "android_app",
                package_name: pkg,
                sha256_cert_fingerprints: certificates,
              },
            },
          ]);
    }
  }
  for (const [link, appIDs] of apple)
    rows[`${EdgeKvPrefix.WellKnown}:${link}:apple-app-site-association`] = JSON.stringify({
      applinks: { details: [{ appIDs, components: [{ "/": "*" }] }] },
    });
  for (const [link, statements] of android)
    rows[`${EdgeKvPrefix.WellKnown}:${link}:assetlinks.json`] = JSON.stringify(statements);

  if (issues.length > 0) throw new RunwayInvalidError("runway.yaml", issues);
  return rows;
}
