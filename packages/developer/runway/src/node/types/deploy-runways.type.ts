/**
 * Stackra file contract:
 * Purpose: `DeployRunways`, the root runway and every member runway as the `runway` binary reads them: plain YAML,
 *          only the keys a deploy plan, a deploy or a promote reads.
 * Boundary: type only; whether a runway file is valid is `pnpm validate`'s check (checkRunwayFiles), not this shape's.
 * Runtime: node
 * Governing contract: ADR 0170 (what deploys where and how a release is promoted); STA-268.
 */

/** A caller workflow file of a target, by its name. */
type Workflows = Readonly<Record<string, string>>;

/** The root runway and the member runways, parsed. */
export interface DeployRunways {
  /** The root `runway.yaml`. */
  readonly root: {
    readonly environments?: Readonly<
      Record<string, { readonly destinations?: Readonly<Record<string, string>> } | undefined>
    >;
    readonly providers: {
      readonly github: { readonly org: string; readonly repo: string };
      readonly infisical?: {
        readonly environments?: Readonly<Record<string, string>>;
        readonly paths?: Readonly<Record<string, string>>;
      };
    };
    readonly targets?: Readonly<Record<string, { readonly workflows?: Workflows } | undefined>>;
    readonly secrets?: { readonly defaultPath?: string; readonly ci?: readonly string[] };
    readonly release?: { readonly buildOrder?: readonly string[] };
  };
  /** Each member runway, by member folder name. */
  readonly members: readonly {
    readonly member: string;
    readonly runway: {
      readonly secrets?: readonly string[];
      readonly environments?: Readonly<
        Record<
          string,
          | {
              readonly secrets?: readonly string[];
              readonly vars?: Readonly<Record<string, unknown>>;
            }
          | undefined
        >
      >;
    };
  }[];
}
