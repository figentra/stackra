/**
 * Stackra file contract:
 * Purpose: `policyOf(statements)`, an IAM policy document (version 2012-10-17) as the JSON string a key, bucket,
 *          topic, vault or role takes, with every Pulumi output inside the statements resolved first.
 * Boundary: internal; builds the JSON only and calls no AWS data source, so the programs run under Pulumi's mocks.
 * Runtime: node
 * Governing contract: ADR 0171 (Pulumi TypeScript).
 */
import * as pulumi from "@pulumi/pulumi";

/** The policy document of `statements`. */
export function policyOf(statements: readonly object[]): pulumi.Output<string> {
  return pulumi
    .output({ Version: "2012-10-17", Statement: statements })
    .apply((document) => JSON.stringify(document));
}
