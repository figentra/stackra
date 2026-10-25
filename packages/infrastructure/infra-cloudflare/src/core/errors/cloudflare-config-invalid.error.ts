/**
 * Stackra file contract:
 * Purpose: `CloudflareConfigInvalidError`, thrown when the Cloudflare program cannot be built from its inputs: the root
 *          runway's `edge` or Cloudflare provider block, the core stack config, a `ref:` value Pulumi config does not
 *          hold, or a tunnel host that breaks the one-label rule. Names the source and every invalid path.
 * Boundary: a plain `Error`, not a refusal: a bad config is an operator's mistake found by `stackra infra preview`
 *           before anything changes. The inputs hold names and ids only, so the issues may quote paths freely.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decision 3: previews are reviewed), ADR 0296 (enforcement: each failure is named).
 */
import type { RunwayIssue } from "@stackra/runway";

/**
 * A Cloudflare program input that fails its check.
 *
 * @example
 * try {
 *   parseEdge(root);
 * } catch (error) {
 *   if (error instanceof CloudflareConfigInvalidError) error.issues; // [{ path: "edge.bots.mode", message: "…" }]
 * }
 */
export class CloudflareConfigInvalidError extends Error {
  /** The file, or a description of where the input came from. */
  readonly source: string;

  /** Every invalid value, in document order. */
  readonly issues: readonly RunwayIssue[];

  /**
   * @param source - the file or a description of the input.
   * @param issues - the invalid values.
   */
  constructor(source: string, issues: readonly RunwayIssue[]) {
    super(
      `${source} is invalid: ${issues.map((issue) => `${issue.path || "(document)"}: ${issue.message}`).join("; ")}`,
    );
    this.name = "CloudflareConfigInvalidError";
    this.source = source;
    this.issues = Object.freeze([...issues]);
  }
}
