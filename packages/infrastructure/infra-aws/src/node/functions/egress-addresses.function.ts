/**
 * Stackra file contract:
 * Purpose: `egressAddresses(name, args, opts)`, the environment's static egress addresses: `count` Elastic IPs held in
 *          the environment's account, tagged as egress, whose public addresses the stack exports for partners to
 *          allow-list (payment providers, banks, government gateways).
 * Boundary: internal; allocates the addresses only. The NAT gateways that send traffic from them belong to the network
 *           (Encore Cloud's VPC or the runtime stack), which takes the exported allocation ids. Retained on delete, so
 *           a stack change never hands a partner's allow-listed address back to AWS.
 * Runtime: node
 * Governing contract: ADR 0402 (static egress addresses published for allow-lists), ADR 0172 (decision 5: tags).
 */
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

/**
 * The addresses.
 *
 * @param args.count - how many addresses (`shared.network.egress.staticIps`).
 * @example
 * const egress = egressAddresses("acme-production", { count: 2 }, options);
 * egress.publicIps; // Output<["203.0.113.10", "203.0.113.11"]>
 */
export function egressAddresses(
  name: string,
  args: { count: number },
  opts: pulumi.CustomResourceOptions,
): { publicIps: pulumi.Output<string[]>; allocationIds: pulumi.Output<string[]> } {
  const addresses = Array.from(
    { length: args.count },
    (_, index) =>
      new aws.ec2.Eip(
        `${name}-egress-${index + 1}`,
        { domain: "vpc", tags: { Name: `${name}-egress-${index + 1}`, purpose: "egress" } },
        { ...opts, retainOnDelete: true },
      ),
  );
  return {
    publicIps: pulumi.all(addresses.map((address) => address.publicIp)),
    allocationIds: pulumi.all(addresses.map((address) => address.allocationId)),
  };
}
