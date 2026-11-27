/**
 * Stackra file contract:
 * Purpose: `taskExecutionRole(name, tags)`, the ECS task execution role a Fargate task runs with: a role only
 *          `ecs-tasks.amazonaws.com` may assume, carrying the AWS-managed task execution policy (image pulls, log
 *          writes). The workloads and the database setup tasks each declare one under their own name.
 * Boundary: declares resources only, inside the Pulumi program that calls it; the caller adds any further policy (the
 *           workloads roles SSM read, the setup roles secret read). Both resources take `name`, so a caller that
 *           declared them inline before keeps its resource names.
 * Runtime: node
 * Governing contract: ADR 0444 (decision 4: Fargate), ADR 0493 (decision 2), ADR 0172 (decision 5: tags).
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import * as aws from "@pulumi/aws";
import type * as pulumi from "@pulumi/pulumi";

/** The AWS-managed policy every task execution role carries (image pulls, log writes). */
const EXECUTION_POLICY = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy";

/**
 * Declares a task execution role named `name` and attaches the managed task execution policy to it.
 *
 * @param tags - the tags the role carries.
 * @example
 * const role = taskExecutionRole("academorix-dev-workloads-execution", { env: "dev" });
 */
export function taskExecutionRole(
  name: string,
  tags: pulumi.Input<Record<string, pulumi.Input<string>>>,
): aws.iam.Role {
  const role = new aws.iam.Role(name, {
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { Service: "ecs-tasks.amazonaws.com" },
          Action: "sts:AssumeRole",
        },
      ],
    }),
    tags,
  });
  new aws.iam.RolePolicyAttachment(name, { role: role.name, policyArn: EXECUTION_POLICY });
  return role;
}
