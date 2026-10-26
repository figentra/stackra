/**
 * Stackra file contract:
 * Purpose: test fixtures for the Pulumi programs: `mockPulumi(config)` runs them under Pulumi's mocks (project `infra`,
 *          so a project config key is `infra:<key>`) with the given stack config and records every resource they
 *          declare (type, name, inputs and the import id); `settled(value)` waits until every resource in a returned
 *          tree is registered; `declaredAs` filters the record by type and `inputsByName` keys its inputs by name.
 * Boundary: test only. No Pulumi engine, no provider and no cloud call: the mocks answer each registration with the
 *           inputs as state and `<name>-id` (or the import id) as the id.
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
  readonly importId: string | undefined;
};

/** Puts Pulumi under mocks with `config` as the stack config; returns the live list of declared resources. */
export async function mockPulumi(
  config: Readonly<Record<string, string>> = {},
): Promise<DeclaredResource[]> {
  const declared: DeclaredResource[] = [];
  await pulumi.runtime.setMocks(
    {
      newResource: (args) => {
        // The engine hands an empty id, not undefined, to a resource that is not imported.
        const importId = args.id || undefined;
        declared.push({ type: args.type, name: args.name, inputs: args.inputs, importId });
        return { id: importId ?? `${args.name}-id`, state: args.inputs };
      },
      call: (args) => args.inputs,
    },
    "infra",
    "test",
    false,
  );
  pulumi.runtime.setAllConfig({ ...config });
  return declared;
}

/** Waits until every resource found in `value` (objects and arrays, walked deeply) is registered. */
export async function settled(value: unknown): Promise<void> {
  const registrations: Promise<unknown>[] = [];
  const walk = (node: unknown): void => {
    if (pulumi.Resource.isInstance(node))
      registrations.push(new Promise((resolve) => node.urn.apply(resolve)));
    else if (Array.isArray(node)) node.forEach(walk);
    else if (typeof node === "object" && node !== null) Object.values(node).forEach(walk);
  };
  walk(value);
  await Promise.all(registrations);
}

/** The declared resources of the provider type `type` (`cloudflare:index/zone:Zone`), in registration order. */
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
