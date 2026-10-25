/**
 * Stackra file contract:
 * Purpose: test fixtures for the Pulumi programs: `mockPulumi()` runs them under Pulumi's mocks and records every
 *          resource they declare (type, name, inputs), answering each registration with its inputs plus fake values
 *          for the output-only properties the programs read (`OUTPUTS`); `settled(value)` waits until every resource
 *          in a returned tree is registered; `valueOf(output)` reads an output; `declaredAs` filters the record by
 *          type and `inputsByName` keys its inputs by resource name.
 * Boundary: test only. No Pulumi engine, no provider and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (agents never run pulumi up; programs are tested under
 *                     mocks).
 */
import * as pulumi from "@pulumi/pulumi";

/** One resource a program declared, as the engine received it. */
export type DeclaredResource = {
  readonly type: string;
  readonly name: string;
  readonly inputs: Record<string, unknown>;
};

/** Fake output-only properties per resource type, from the resource name. */
const OUTPUTS: Readonly<Record<string, (name: string) => Record<string, unknown>>> = {
  "aws:s3/bucket:Bucket": (name) => ({
    arn: `arn:aws:s3:::${name}`,
    bucketRegionalDomainName: `${name}.s3.me-central-1.amazonaws.com`,
  }),
  "aws:iam/accessKey:AccessKey": (name) => ({ secret: `${name}-secret` }),
  "better-uptime:index/heartbeat:Heartbeat": (name) => ({
    url: `https://uptime.betterstack.test/${name}`,
  }),
  "logtail:index/source:Source": (name) => ({
    ingestingHost: `${name}.ingest.test`,
    token: `${name}-token`,
  }),
  "sentry:index/sentryKey:SentryKey": (name) => ({ dsnPublic: `https://${name}@sentry.test/1` }),
};

/** Puts Pulumi under mocks; returns the live list of declared resources. */
export async function mockPulumi(): Promise<DeclaredResource[]> {
  const declared: DeclaredResource[] = [];
  await pulumi.runtime.setMocks(
    {
      newResource: (args) => {
        declared.push({ type: args.type, name: args.name, inputs: args.inputs });
        return {
          id: `${args.name}-id`,
          state: { ...args.inputs, ...OUTPUTS[args.type]?.(args.name) },
        };
      },
      call: (args) => args.inputs,
    },
    "infra",
    "test",
    false,
  );
  return declared;
}

/** Waits until every resource found in `value` (objects and arrays, walked deeply) is registered. */
export async function settled(value: unknown): Promise<void> {
  const registrations: Promise<unknown>[] = [];
  const walk = (node: unknown): void => {
    if (pulumi.Resource.isInstance(node))
      registrations.push(new Promise((resolve) => node.urn.apply(resolve)));
    else if (Array.isArray(node)) node.forEach(walk);
    else if (typeof node === "object" && node !== null && !pulumi.Output.isInstance(node))
      Object.values(node).forEach(walk);
  };
  walk(value);
  await Promise.all(registrations);
}

/** The value of `output` once known. */
export function valueOf<T>(output: pulumi.Output<T>): Promise<T> {
  return new Promise((resolve) => output.apply(resolve));
}

/** The declared resources of the provider type `type` (`sentry:index/sentryTeam:SentryTeam`), in order. */
export function declaredAs(
  declared: readonly DeclaredResource[],
  type: string,
): DeclaredResource[] {
  return declared.filter((resource) => resource.type === type);
}

/** The inputs of each declared resource of `type`, keyed by resource name, so no assertion leans on the order. */
export function inputsByName(
  declared: readonly DeclaredResource[],
  type: string,
): Record<string, Record<string, unknown>> {
  return Object.fromEntries(
    declaredAs(declared, type).map((resource) => [resource.name, resource.inputs]),
  );
}
