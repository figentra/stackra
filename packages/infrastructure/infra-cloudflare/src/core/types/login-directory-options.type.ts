/**
 * Stackra file contract:
 * Purpose: `LoginDirectoryOptions`, what `loginDirectoryHandler` is built from: the KV binding, the deployment's region
 *          keys in the order the region picker shows them, and the function that turns an identifier into its keyed
 *          prefix (`@stackra/identity/contracts`' `loginDirectoryPrefix` with the Worker's key, wired by the host).
 * Boundary: type only. The region list and the key id are deployment config; the hash key is a Worker secret the host
 *           closes over in `prefixOf`, so it never passes through this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0451; ADR 0353 (decisions 1 and 4).
 */
import type { LoginDirectoryKv } from "#core/types/login-directory-kv.type";

/** The login directory Worker's inputs. */
export type LoginDirectoryOptions = {
  readonly kv: LoginDirectoryKv;
  /** The deployment's region keys; a row for any other region is ignored. */
  readonly regions: readonly string[];
  /** The `dir:<key id>:<kind>:<hash>:` prefix of an identifier, or `undefined` when it does not normalise. */
  readonly prefixOf: (identifier: {
    readonly kind: string;
    readonly value: string;
  }) => Promise<string | undefined>;
};
