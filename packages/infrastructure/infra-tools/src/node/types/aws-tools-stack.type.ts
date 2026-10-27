/**
 * Stackra file contract:
 * Purpose: `AwsToolsStack`, what `awsToolsStack` returns: the cluster and namespace ids, each tool's ECS service, the
 *          region's endpoints as plain data for the stack's outputs, and, when declared, the Valkey address, the
 *          database task the deploy runs, and the role Infisical's sync assumes.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0444; ADR 0173; ADR 0238.
 */
import type * as pulumi from "@pulumi/pulumi";

import type { ToolEndpoint } from "#core/types/tool-endpoint.type";

/** One region's declared tools stack. */
export type AwsToolsStack = {
  /** The ECS cluster id. */
  readonly cluster: pulumi.Output<string>;
  /** The private service-discovery namespace id. */
  readonly namespace: pulumi.Output<string>;
  /** Tool key to its ECS service id. */
  readonly services: Readonly<Record<string, pulumi.Output<string>>>;
  /** What OS integrations registers as managed Connections. */
  readonly endpoints: readonly ToolEndpoint[];
  /** The Valkey primary address, when a tool reads a cache URL. */
  readonly cache?: pulumi.Output<string>;
  /** The one-shot task that creates the tools' databases; the deploy runs it with `aws ecs run-task`. */
  readonly databaseTask?: pulumi.Output<string>;
  /** The role ARN the Infisical AWS connection assumes to write the parameters. */
  readonly secretsSyncRole?: pulumi.Output<string>;
};
