/**
 * Stackra file contract:
 * Purpose: `AwsToolsStack`, what `awsToolsStack` returns: the cluster and namespace ids, each tool's ECS service, and
 *          the region's endpoints as plain data for the stack's outputs.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0444.
 */
import type * as pulumi from "@pulumi/pulumi";

import type { ToolEndpoint } from "#core/types/tool-endpoint.type";

/** One region's declared tools stack. */
export type AwsToolsStack = {
  readonly cluster: pulumi.Output<string>;
  readonly namespace: pulumi.Output<string>;
  /** Tool key to its ECS service id. */
  readonly services: Readonly<Record<string, pulumi.Output<string>>>;
  /** What OS integrations registers as managed Connections. */
  readonly endpoints: readonly ToolEndpoint[];
};
