/**
 * Stackra file contract:
 * Purpose: `connectionsOf`, the exported lookup of registered Connection classes by capability: every connection class
 *          whose Integration declares the connector kind, or is listed under the category, keyed by provider code, so
 *          a module resolves an accounting, EDI or fulfilment Connection it does not define itself.
 * Boundary: reads the registry `registerConnections` filled (gen emits it for every member, so the lookup sees the
 *           Connections of every installed package, the OS connectors included). The answer is a `ProviderDrivers`
 *           map for `ProviderResolver`; it lists drivers only, never which Market uses which. The interface type `T`
 *           is the caller's word: a kind names its interface (`ConnectorKind`), a category does not, so a category
 *           lookup answers the classes as they are. Two Integrations of one provider code are a broken registration
 *           (ADR 0355 decision 1), refused with a `TypeError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 2); ADR 0356 (decision 2); ADR 0355 (decisions 1 and 6); ADR 0308 (rule 2).
 */
import type { Connection } from "#core/bases/connection.base";
import { CONNECTION_REGISTRY } from "#core/constants/connection-registry.constant";
import type { ConnectorKind } from "#core/enums/connector-kind.enum";
import type { IntegrationCategory } from "#core/enums/integration-category.enum";
import { integrationOptionsOf } from "#core/functions/integration-options-of.function";
import type { ConnectionClass } from "#core/types/connection-class.type";
import type { ProviderDrivers } from "#core/types/provider-drivers.type";

/**
 * The registered connection classes of `capability`, by provider code.
 *
 * @throws TypeError when two registered Integrations share a provider code.
 * @example
 * const drivers = connectionsOf<EdiConnector>(ConnectorKind.Edi);
 * const edi = await resolver.resolve(ConnectorKind.Edi, drivers);
 */
export function connectionsOf<T = unknown>(
  capability: ConnectorKind | IntegrationCategory,
): ProviderDrivers<T> {
  const out: Record<string, ConnectionClass<Connection & T>> = {};
  for (const { connection, integration } of CONNECTION_REGISTRY.values()) {
    const { provider, category, connectors = [] } = integrationOptionsOf(integration);
    if (category !== capability && !(connectors as readonly string[]).includes(capability))
      continue;
    if (Object.hasOwn(out, provider) && out[provider] !== connection)
      throw new TypeError(
        `${out[provider]?.name} and ${connection.name} both connect provider "${provider}"; keep one Integration per provider`,
      );
    out[provider] = connection as ConnectionClass<Connection & T>;
  }
  return Object.freeze(out);
}
