/**
 * Stackra file contract:
 * Purpose: `egressAddresses(name, args, opts)`, the deployment's static egress addresses: `count` regional external
 *          addresses reserved in the deployment's project and region, labelled as egress, whose public addresses the
 *          stack exports for partners to allow-list (payment providers, banks, government gateways).
 * Boundary: internal; the GCP twin of infra-aws's egress addresses. It reserves the addresses only: the Cloud NAT that
 *           sends traffic from them (`natIpAllocateOption: MANUAL_ONLY`) belongs to the network (Encore Cloud's VPC or
 *           the runtime stack), which takes the exported self links. Retained on delete, so a stack change never hands
 *           a partner's allow-listed address back to Google.
 * Runtime: node
 * Governing contract: ADR 0402 (decision 2: static egress addresses published for allow-lists), ADR 0354 (decision 3),
 *                     ADR 0172 (decision 5: labels).
 */
import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

/**
 * The addresses.
 *
 * @param args.count - how many addresses (`shared.network.egress.staticIps`).
 * @example
 * const egress = egressAddresses("acme-production", { project, region: "me-central2", count: 2 }, options);
 * egress.publicIps; // Output<["203.0.113.10", "203.0.113.11"]>
 */
export function egressAddresses(
  name: string,
  args: { project: string; region: string; count: number },
  opts: pulumi.CustomResourceOptions,
): { publicIps: pulumi.Output<string[]>; selfLinks: pulumi.Output<string[]> } {
  const addresses = Array.from(
    { length: args.count },
    (_, index) =>
      new gcp.compute.Address(
        `${name}-egress-${index + 1}`,
        {
          name: `${name}-egress-${index + 1}`,
          project: args.project,
          region: args.region,
          addressType: "EXTERNAL",
          labels: { purpose: "egress" },
        },
        { ...opts, retainOnDelete: true },
      ),
  );
  return {
    publicIps: pulumi.all(addresses.map((address) => address.address)),
    selfLinks: pulumi.all(addresses.map((address) => address.selfLink)),
  };
}
