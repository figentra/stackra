/**
 * Stackra file contract:
 * Purpose: `WranglerEdgeKvDriver`, the `wrangler` driver of the `EdgeKvWriter` port: writes and removes rows of the
 *          edge KV copy with `wrangler kv key put|get|delete --remote` in the configured namespace. Runway writes the
 *          platform `host:`, `wellknown:`, `release:`, `canary:` and `shell:` rows with it until the OS edge
 *          projector exists (app-shells 16.10).
 * Boundary: runs `wrangler` only, through the given `CommandRunner`; the account and token are wrangler's own login
 *           (OIDC in CI), never arguments. Writes exactly the key given: building keys and values is the publish
 *           functions'.
 * Runtime: node
 * Governing contract: ADR 0437 (the KV copy); app-shells 5.3 and 16 (point 10); ADR 0352 (decision 3: a provider
 *                     runs the destination's own CLI).
 */
import { EdgeKvWriter } from "@stackra/app/contracts";
import { Driver } from "@stackra/container";

import { EDGE_PUBLISH_SETTINGS } from "#node/constants/edge-publish-settings.constant";
import type { EdgeKvConfig } from "#node/config/edge-kv.config";
import { runProgram } from "#node/functions/run-program.function";
import type { CommandRunner } from "#node/types/command-runner.type";

/** How wrangler reports a missing key: the KV API's 404, in the failed fetch it throws. */
const NOT_FOUND = / - 404: Not Found/;

/**
 * Writes the edge KV copy through wrangler.
 *
 * @example
 * const kv = new WranglerEdgeKvDriver(buildConfig(EdgeKvConfig, { values: { namespaceId } }));
 * await publishProduct({ repository, environment: "staging", kv, assets, served, canaryScopes });
 */
export class WranglerEdgeKvDriver extends Driver(EdgeKvWriter) {
  /** The command runner, `runProgram`; a test or a dry run replaces it. */
  run: CommandRunner = runProgram;

  /** Variables wrangler runs with, such as `CLOUDFLARE_ACCOUNT_ID`. */
  env?: Readonly<Record<string, string>>;

  private readonly namespace: string;

  /**
   * @param config - holds the namespace id of the edge KV copy.
   * @throws TypeError when the namespace id is unset.
   */
  constructor(config: EdgeKvConfig) {
    super();
    if (config.namespaceId === "")
      throw new TypeError("Set the edge KV namespace id (EdgeKvConfig.namespaceId)");
    this.namespace = `--namespace-id=${config.namespaceId}`;
  }

  /** Stores `value` under `key`; with `ttlSeconds` Workers KV expires it (wrangler's `--ttl`). */
  override async put(key: string, value: string, ttlSeconds?: number): Promise<void> {
    await this.run(
      EDGE_PUBLISH_SETTINGS.wrangler,
      [
        "kv",
        "key",
        "put",
        key,
        value,
        this.namespace,
        ...(ttlSeconds === undefined ? [] : [`--ttl=${ttlSeconds}`]),
        "--remote",
      ],
      this.env === undefined ? {} : { env: this.env },
    );
  }

  /** The row under `key`, or `null` when wrangler answers the API's 404 (no such key); any other failure throws. */
  override async read(key: string): Promise<string | null> {
    try {
      return await this.run(
        EDGE_PUBLISH_SETTINGS.wrangler,
        ["kv", "key", "get", key, this.namespace, "--text", "--remote"],
        this.env === undefined ? {} : { env: this.env },
      );
    } catch (error) {
      if (NOT_FOUND.test(String((error as Error).message))) return null;
      throw error;
    }
  }

  /** Removes the row under `key`. */
  override async delete(key: string): Promise<void> {
    await this.run(
      EDGE_PUBLISH_SETTINGS.wrangler,
      ["kv", "key", "delete", key, this.namespace, "--remote"],
      this.env === undefined ? {} : { env: this.env },
    );
  }
}
