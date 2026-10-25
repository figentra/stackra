/**
 * Stackra file contract:
 * Purpose: `identityPlan(root, seed, instance)`, what one ZITADEL instance holds: its domain and the environments it
 *          serves from the root runway's `providers.zitadel`, and from the seed the staff organisation, the project
 *          and its roles, each app with the callbacks of those environments, the machine users and the branding.
 * Boundary: pure: a parsed root runway and seed in, a plan out. Reports every failure at once. An app with no
 *           callback on the instance (and no device code) is left off it, so an app that runs only in production has
 *           no client on the non-production instance. Reads no file and calls no cloud; the Pulumi slice is
 *           `./node`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decisions 4, 5 and 8), ADR 0241 (decisions 2 and 4), ADR 0277 (decisions 1 and 2),
 *                     ADR 0290 (decision 8), ADR 0296 (decision 2: accounts and vendors are root facts), ADR 0171
 *                     (decision 3).
 */
import { Enum } from "@stackra/contracts";
import { RunwayEnvironment } from "@stackra/runway";
import type { RootRunway, RunwayIssue } from "@stackra/runway";

import { ZITADEL_PROVIDER_SCHEMA } from "#core/constants/zitadel-provider-schema.constant";
import { IdentityAppKind } from "#core/enums/identity-app-kind.enum";
import { IdentityInfraInvalidError } from "#core/errors/identity-infra-invalid.error";
import type { IdentityPlan } from "#core/types/identity-plan.type";
import type { IdentityPlanApp } from "#core/types/identity-plan-app.type";
import type { IdentitySeed } from "#core/types/identity-seed.type";

/** The error's source. */
const SOURCE = "the identity seed and root runway";

/** Loopback hosts a native app may call back on over `http://` (RFC 8252 section 7.3). */
const LOOPBACK = ["127.0.0.1", "localhost", "[::1]"];

/**
 * The plan of one ZITADEL instance.
 *
 * @param root - the parsed root runway.
 * @param seed - the parsed seed.
 * @param instance - a name in `providers.zitadel.instances` (`nonprod`, `prod`).
 * @throws IdentityInfraInvalidError naming every invalid path, prefixed `root.` or `seed.`: `providers.zitadel` is
 *         missing or invalid, the instance is not declared, or a callback the instance would hold is not allowed
 *         there (a pattern such as `${pr}`, a relative or fragment URI, a BFF callback that is not `http(s)://`, an
 *         `http://` BFF callback on a production instance, or a native `http://` callback off loopback).
 * @example
 * const plan = identityPlan(readRunway("runway.yaml", "root"), readIdentitySeed(".stackra/zitadel/seed.yaml"), "nonprod");
 * plan.issuer; // "https://id.staging.acme.example"
 */
export function identityPlan(root: RootRunway, seed: IdentitySeed, instance: string): IdentityPlan {
  const block = root.providers?.["zitadel"];
  if (block === undefined) {
    throw new IdentityInfraInvalidError(SOURCE, [
      { path: "root.providers.zitadel", message: "The identity stack needs the ZITADEL instances" },
    ]);
  }
  const provider = ZITADEL_PROVIDER_SCHEMA.safeParse(block);
  if (!provider.success) {
    throw new IdentityInfraInvalidError(
      SOURCE,
      provider.error.issues.map((issue) => ({
        path: ["root.providers.zitadel", ...issue.path.map(String)].join("."),
        message: issue.message,
      })),
    );
  }
  const target = provider.data.instances[instance];
  if (target === undefined) {
    throw new IdentityInfraInvalidError(SOURCE, [
      {
        path: `root.providers.zitadel.instances.${instance}`,
        message: `No ZITADEL instance is named ${instance}`,
      },
    ]);
  }

  const environments = Enum.values(RunwayEnvironment).filter((environment) =>
    target.environments.includes(environment),
  );
  const production = environments.includes(RunwayEnvironment.Production);
  const issues: RunwayIssue[] = [];
  const apps: IdentityPlanApp[] = [];

  for (const [key, app] of Object.entries(seed.apps)) {
    let devMode = false;
    // Why a callback is not allowed on this instance, or null.
    const problem = (uri: string): string | null => {
      if (uri.includes("${")) {
        return "ZITADEL matches a callback exactly; the preview job registers a pull request's own";
      }
      let url: URL;
      try {
        url = new URL(uri);
      } catch {
        return "Expected an absolute URI";
      }
      if (url.hash !== "") return "A callback has no fragment";
      if (url.protocol === "https:") return null;
      if (app.kind === IdentityAppKind.Native) {
        return url.protocol !== "http:" || LOOPBACK.includes(url.hostname)
          ? null
          : "A native app calls back on a custom scheme, https:// or a loopback address";
      }
      if (url.protocol !== "http:") return "A BFF calls back on an https:// route";
      if (production) return "An instance that serves production takes https:// callbacks only";
      devMode = true;
      return null;
    };
    const collect = (field: "redirectUris" | "postLogoutRedirectUris"): string[] => {
      const uris = new Set<string>();
      for (const environment of environments) {
        (app[field][environment] ?? []).forEach((uri, index) => {
          const message = problem(uri);
          if (message === null) uris.add(uri);
          else issues.push({ path: `seed.apps.${key}.${field}.${environment}.${index}`, message });
        });
      }
      return [...uris];
    };
    const redirectUris = collect("redirectUris");
    const postLogoutRedirectUris = collect("postLogoutRedirectUris");
    if (redirectUris.length === 0 && !app.deviceCode) continue;
    apps.push({
      key,
      kind: app.kind,
      redirectUris,
      postLogoutRedirectUris,
      devMode,
      deviceCode: app.deviceCode,
      tokenExchange: app.tokenExchange,
    });
  }

  if (issues.length > 0) throw new IdentityInfraInvalidError(SOURCE, issues);

  return {
    instance,
    domain: target.domain,
    issuer: `https://${target.domain}`,
    environments,
    org: seed.org,
    project: seed.project,
    apps,
    machines: seed.machines,
    branding: seed.branding ?? null,
  };
}
