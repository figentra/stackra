/**
 * Stackra file contract:
 * Purpose: `ProductDeploy`, the deploy manifest (`dist/product/deploy-<environment>.json`): what the deploy published
 *          (bundles uploaded, KV rows written, release pointers or canaries), the landing seed documents it found,
 *          the mobile submissions, and the external commands a dry run recorded.
 * Boundary: type only; plain JSON data.
 * Runtime: node
 * Governing contract: ADR 0436; ADR 0437; ADR 0439; ADR 0440 (decision 2).
 */
import type { DeployStep } from "#core/types/deploy-step.type";
import type { ProductPublishResult } from "#node/types/product-publish-result.type";

/** One product deploy. */
export type ProductDeploy = {
  /** The product key. */
  readonly product: string;
  /** The environment deployed to. */
  readonly environment: string;
  /** The commit deployed. */
  readonly sha: string;
  /** Whether everything was recorded, not done. */
  readonly dryRun: boolean;
  /** The web publish. */
  readonly surfaces: ProductPublishResult;
  /** Each landing surface's seed documents, imported into experience once (ADR 0440 decision 2). */
  readonly seeds: Readonly<Record<string, readonly string[]>>;
  /** Each mobile app's submitted EAS build ids. */
  readonly submitted: Readonly<Record<string, readonly string[]>>;
  /** The external commands a dry run recorded, in order. */
  readonly planned: readonly DeployStep[];
};
