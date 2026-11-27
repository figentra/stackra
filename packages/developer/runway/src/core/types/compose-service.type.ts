/**
 * Stackra file contract:
 * Purpose: `ComposeService`, one service of the Compose file `devComposeOf` writes: image, restart policy, published
 *          ports, variables, command, volumes, health check and profiles.
 * Boundary: type only; the keys are Compose's own spelling (`start_period`), so it serialises to YAML as it is.
 * Runtime: isomorphic
 * Governing contract: the Compose specification (compose-spec.io); ADR 0199 (decision 3); STA-2664 (item 6).
 */

/** One Compose service. */
export type ComposeService = {
  /** The image the runway pins, digest included. */
  readonly image: string;
  /** Restarts with the Docker engine until stopped, so the next `stackra dev` finds it running. */
  readonly restart: "unless-stopped";
  /** The published ports, each `127.0.0.1:<host>:<container>`. */
  readonly ports: readonly string[];
  /** The plain container variables; never a credential. */
  readonly environment?: Readonly<Record<string, string>>;
  /** The arguments after the image's entrypoint. */
  readonly command?: readonly string[];
  /** The named volumes, each `<volume>:<container folder>`. */
  readonly volumes?: readonly string[];
  /** What `docker compose up --wait` waits on. */
  readonly healthcheck?: {
    readonly test: readonly string[];
    readonly interval: string;
    readonly timeout: string;
    readonly retries: number;
    readonly start_period: string;
  };
  /** The profile an opt-in service starts under: its own name. */
  readonly profiles?: readonly string[];
};
