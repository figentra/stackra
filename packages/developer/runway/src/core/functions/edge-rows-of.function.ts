/**
 * Stackra file contract:
 * Purpose: `edgeRowsOf(root, environment, signing)`, the KV rows Runway owns for one environment: a `host:` row per
 *          surface host (product, surface, home region, status, realm and canonical host) and, for every host a
 *          mobile app links, `wellknown:` rows for `apple-app-site-association` and `assetlinks.json` covering every
 *          app that links it.
 * Boundary: pure; `registerPlatformHosts` writes the rows. Platform hosts only: tenant hosts and status changes are
 *           the edge projector's. A platform host answers in the tenant realm (the ops host is the OS's, not a
 *           product's), and its home region is the environment's first region when it lists any.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (decision 6: Runway writes platform `host:` rows and app-link `wellknown:` rows), ADR
 *                     0436 (decision 11: hosts under the environment's zone), ADR 0439 (decision 2).
 */
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import type { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import type { AppLinkSigning } from "#core/types/app-link-signing.type";
import type { EdgeRow } from "#core/types/edge-row.type";
import type { RootRunway } from "#core/types/root-runway.type";

/** The status a platform host starts in. */
const ACTIVE = "active";

/** The realm a product's platform host answers in. */
const TENANT_REALM = "tenant";

/** The `host:` rows of every surface host. */
function hostRows(root: RootRunway, environment: RunwayEnvironment): EdgeRow[] {
  const scope = root.environments[environment];
  const rows: EdgeRow[] = [];
  for (const [surface, entry] of Object.entries(root.surfaces ?? {})) {
    if (entry?.host === undefined) continue;
    const zone = scope?.domains?.zone;
    if (zone === undefined)
      throw new RunwayUnresolvedError(
        `surfaces.${surface}.host needs environments.${environment}.domains.zone`,
      );
    if (root.product === undefined)
      throw new RunwayUnresolvedError(
        "the root runway declares hosts but no product: add product.key",
      );
    const hostname = `${entry.host}.${zone}`;
    const region = scope?.regions?.[0];
    rows.push({
      key: `host:${hostname}`,
      value: JSON.stringify({
        product: root.product.key,
        surface,
        ...(region === undefined ? {} : { region }),
        status: ACTIVE,
        realm: TENANT_REALM,
        canonical: hostname,
      }),
    });
  }
  return rows;
}

/** The `wellknown:` rows of every host a mobile app links. */
function appLinkRows(root: RootRunway, signing: AppLinkSigning): EdgeRow[] {
  const apple = new Map<string, string[]>();
  const android = new Map<string, unknown[]>();
  for (const [key, app] of Object.entries(root.mobile ?? {})) {
    const { ios, android: play, links = [] } = app.identity;
    for (const host of links) {
      if (ios !== undefined) {
        const team = signing.appleTeamIds[ios.team];
        if (team === undefined)
          throw new RunwayUnresolvedError(
            `mobile.${key}: no Apple team id for the account "${ios.team}"`,
          );
        apple.set(host, [...(apple.get(host) ?? []), `${team}.${ios.bundleId}`]);
      }
      if (play !== undefined) {
        const fingerprints = signing.androidFingerprints[play.package] ?? [];
        if (fingerprints.length === 0)
          throw new RunwayUnresolvedError(
            `mobile.${key}: no signing fingerprint for the package "${play.package}"`,
          );
        android.set(host, [
          ...(android.get(host) ?? []),
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: {
              namespace: "android_app",
              package_name: play.package,
              sha256_cert_fingerprints: fingerprints,
            },
          },
        ]);
      }
    }
  }
  return [
    ...[...apple].map(([host, appIDs]) => ({
      key: `wellknown:${host}:apple-app-site-association`,
      value: JSON.stringify({
        applinks: { details: [{ appIDs, components: [{ "/": "*" }] }] },
        webcredentials: { apps: appIDs },
      }),
    })),
    ...[...android].map(([host, statements]) => ({
      key: `wellknown:${host}:assetlinks.json`,
      value: JSON.stringify(statements),
    })),
  ];
}

/**
 * The `host:` and `wellknown:` rows Runway writes for `environment`.
 *
 * @param root - the parsed root runway.
 * @param environment - the environment whose zone the surface hosts sit under.
 * @param signing - the Apple team ids and Android fingerprints the app-link files name.
 * @throws RunwayUnresolvedError when a host has no zone or product, or a linked app has no team id or fingerprint.
 * @example
 * edgeRowsOf(root, "production", signing)[0];
 * // { key: "host:console.mezzora.figentra.com", value: '{"product":"mezzora","surface":"console",…}' }
 */
export function edgeRowsOf(
  root: RootRunway,
  environment: RunwayEnvironment,
  signing: AppLinkSigning,
): EdgeRow[] {
  return [...hostRows(root, environment), ...appLinkRows(root, signing)];
}
