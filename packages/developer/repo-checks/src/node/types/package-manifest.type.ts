/**
 * Stackra file contract:
 * Purpose: `PackageManifest`, the fields of a member's `package.json` the structure checks read. Every field is
 *          optional because the checks exist to report the missing ones.
 * Boundary: type only; parsed JSON is cast to it, so a field can still hold the wrong shape at runtime and the checks
 *           compare values instead of trusting types.
 * Runtime: node
 * Governing contract: ADR 0025 (exports); ADR 0177 (publishing); ADR 0195 (licences); ADR 0090 (`stackra.module`).
 */

/** The `package.json` fields the checks read. */
export type PackageManifest = {
  /** The npm name. */
  readonly name?: string | undefined;

  /** The one-line description. */
  readonly description?: string | undefined;

  /** The SPDX licence or `UNLICENSED`. */
  readonly license?: string | undefined;

  /** True keeps npm from publishing it. */
  readonly private?: boolean | undefined;

  /** Must be `false` in a library. */
  readonly sideEffects?: unknown;

  /** The conditional exports map, or a plain string. */
  readonly exports?: unknown;

  /** The `files` allow list of the tarball. */
  readonly files?: readonly string[] | undefined;

  /** Where and how it publishes. */
  readonly publishConfig?:
    | {
        /** `public` for npmjs. */
        readonly access?: string | undefined;
        /** True asks npm for a provenance statement. */
        readonly provenance?: boolean | undefined;
        /** The registry URL. */
        readonly registry?: string | undefined;
        /** The packed exports of the Pro wrapper. */
        readonly exports?: unknown;
      }
    | undefined;

  /** The source repository npm provenance checks. */
  readonly repository?:
    | {
        /** The git URL. */
        readonly url?: string | undefined;
        /** The member directory inside the repository. */
        readonly directory?: string | undefined;
      }
    | undefined;

  /** Search terms: "stackra", the category, then domain terms (ADR 0453 decision 11, amendment of 2026-10-27). */
  readonly keywords?: readonly string[] | undefined;

  /** The member's README on GitHub. */
  readonly homepage?: string | undefined;

  /** Where issues are filed. */
  readonly bugs?: { readonly url?: string | undefined } | undefined;

  /** Who publishes it, as npm shows it: `Figentra (https://figentra.com)`. */
  readonly author?: string | undefined;

  /** The Node versions it supports. */
  readonly engines?: { readonly node?: string | undefined } | undefined;

  /** The `stackra` field: the registry kind and agent metadata (ADR 0453 decision 11), and a v2 service's module. */
  readonly stackra?:
    | {
        /** The registry item kind; `package` for every member. */
        readonly kind?: string | undefined;
        /** The tier tag without `tier:`. */
        readonly tier?: string | undefined;
        /** The `packages/<category>` folder. */
        readonly category?: string | undefined;
        /** Where its entries run. */
        readonly runtimes?: readonly string[] | undefined;
        /** When an agent reaches for it. */
        readonly summary?: string | undefined;
        /** The path of the v2 root module, `./src/<name>.module.ts` (ADR 0090). */
        readonly module?: string | undefined;
      }
    | undefined;

  /** Runtime dependencies by name. */
  readonly dependencies?: Readonly<Record<string, string>> | undefined;

  /** Build and test dependencies by name. */
  readonly devDependencies?: Readonly<Record<string, string>> | undefined;

  /** Compatible ranges a consumer provides. */
  readonly peerDependencies?: Readonly<Record<string, string>> | undefined;

  /** Dependencies an install may skip. */
  readonly optionalDependencies?: Readonly<Record<string, string>> | undefined;
};
