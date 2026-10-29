/**
 * Stackra file contract:
 * Purpose: `ProductBuild`, the build manifest (`dist/product/build.json`): the product, the commit and bundle version,
 *          per web surface its shell line release, preset, packages, hosts, bundle and landing seed documents, per
 *          mobile app its template release, capabilities, packages and EAS build ids, and the external commands a
 *          dry run recorded instead of running.
 * Boundary: type only; plain JSON data. `buildProduct` writes it, `deployProduct` reads it.
 * Runtime: node
 * Governing contract: ADR 0436; ADR 0439; ADR 0441 (decision 3); ADR 0481.
 */
import type { DeployStep } from "#core/types/deploy-step.type";
import type { BundleManifest } from "#node/types/bundle-manifest.type";

/** A line release as built. */
type LineRelease = { readonly line: string; readonly package: string; readonly version: string };

/** One product build. */
export type ProductBuild = {
  /** The product key. */
  readonly product: string;
  /** The commit built. */
  readonly sha: string;
  /** The bundle version: every surface bundle's folder. */
  readonly version: string;
  /** Whether the EAS builds were recorded, not started. */
  readonly dryRun: boolean;
  /** Per web surface. */
  readonly surfaces: Readonly<
    Record<
      string,
      {
        readonly shell: LineRelease & { readonly importMap: readonly string[] };
        readonly preset?: string;
        readonly packages: readonly string[];
        readonly hosts: readonly string[];
        readonly bundle?: BundleManifest;
        readonly content: readonly string[];
      }
    >
  >;
  /** Per mobile app. */
  readonly mobile: Readonly<
    Record<
      string,
      {
        readonly template: LineRelease;
        readonly dir: string;
        readonly capabilities: readonly string[];
        readonly packages: Readonly<Record<string, string>>;
        readonly buildIds: readonly string[];
      }
    >
  >;
  /** The mobile apps a surfaces-only build left out. */
  readonly skipped: { readonly mobile: readonly string[] };
  /** The external commands a dry run recorded (EAS), in order. */
  readonly planned: readonly DeployStep[];
};
