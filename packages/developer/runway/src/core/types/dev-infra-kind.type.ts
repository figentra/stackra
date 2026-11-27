/**
 * Stackra file contract:
 * Purpose: `DevInfraKind`, what `devComposeOf` knows about one kind of dev infra container (`valkey`, `seaweedfs`,
 *          `mailpit`, `clamav`, `otel-lgtm`): the container port behind each runway port field, which field is the
 *          service's address, whether each lane gets its own, the command, the health check `docker compose up --wait`
 *          waits on, the folder kept in a named volume, how it takes buckets, and the variables a member's local run
 *          gets to reach it.
 * Boundary: type only. Strings in `memberEnv` are templates: `{host}` (127.0.0.1), `{port}` (the address port) and
 *           `{port:<field>}` (a named port), each the host port after the lane shift; `{bucket}` in a bucket probe is
 *           the last bucket named. No credential: every kind here runs on the loopback interface without one, and a
 *           client that must sign gets placeholders (`fallbackCredentials`) only when it has no credential of its own.
 * Runtime: isomorphic
 * Governing contract: ADR 0199 (decision 3: `stackra dev` runs a small compose file); ADR 0296 (decision 1);
 *                     STA-2664 (item 6).
 */
import type { DevCredentialFallback } from "#core/types/dev-credential-fallback.type";
import type { DevInfraHealthcheck } from "#core/types/dev-infra-healthcheck.type";

/** One kind of dev infra container. */
export type DevInfraKind = {
  /** Each runway port field to the port the container listens on (`{ port: 6379 }`). */
  readonly ports: Readonly<Record<string, number>>;
  /** The port field the service's address uses. */
  readonly primary: string;
  /** The scheme of the service's address (`redis`, `http`, `tcp`). */
  readonly scheme: string;
  /** Whether each lane runs its own container; `false` runs one for every lane (a block's `perLane` wins). */
  readonly perLane: boolean;
  /** The arguments after the image's entrypoint; none keeps the image's own. */
  readonly command?: readonly string[];
  /** Plain container variables; never a credential. */
  readonly environment?: Readonly<Record<string, string>>;
  /** The container folder kept in a named volume between runs. */
  readonly volume?: string;
  /** What `docker compose up --wait` waits on; none waits for the container to run. */
  readonly healthcheck?: DevInfraHealthcheck;
  /** How a block's `buckets` reach the container: one command argument, and the probe that waits for the last. */
  readonly buckets?: { readonly argument: string; readonly probe: readonly string[] };
  /** The variables a member's local run gets, as templates. */
  readonly memberEnv?: Readonly<Record<string, string>>;
  /** Placeholder credentials a member's client signs with, only when it has none of its own on that chain. */
  readonly fallbackCredentials?: DevCredentialFallback;
};
