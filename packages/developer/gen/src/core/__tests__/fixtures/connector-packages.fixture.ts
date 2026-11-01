/**
 * Stackra file contract:
 * Purpose: `connectorPackage`, a dependency as two OS connector packages ship it (`@figentra/connector-<vendor>`, ADR
 *          0259 decision 5): a package manifest whose one Integration has its connection, key and egress, and
 *          `CONNECTOR_PACKAGES`, the wallet and paylink connectors the package-integration tests host.
 * Boundary: test data only; never imported by package code.
 * Runtime: node (vitest)
 * Governing contract: ADR 0259 (decision 5); ADR 0308 (rules 16 and 19); STA-1712.
 */
import type { MemberIR } from "#core/types/member-ir.type";

/** A dependency entry of `ir.dependencies`. */
type Dependency = MemberIR["dependencies"][number];

/**
 * The connector package of `vendor`, its Integration keyed `<member>.<vendor>`.
 *
 * @example
 * connectorPackage("wallet").manifest.integrations; // [{ key: "connector_wallet.wallet", … }]
 */
export function connectorPackage(vendor: string): Dependency {
  const member = `connector_${vendor}`;
  const title = `${vendor.charAt(0).toUpperCase()}${vendor.slice(1)}`;
  return {
    package: `@figentra/connector-${vendor}`,
    manifest: {
      member,
      package: `@figentra/connector-${vendor}`,
      version: "0.1.0",
      kind: "package",
      integrations: [
        {
          key: `${member}.${vendor}`,
          class: `${title}Integration`,
          module: member,
          file: `src/node/${vendor}.integration.ts`,
          connection: `${title}Connection`,
          connectionFile: `src/node/${vendor}.connection.ts`,
          roles: ["driver"],
          egress: { origin: `https://api.${vendor}.example` },
        },
      ],
    },
  };
}

/** Two connector packages, as the OS integrations service declares them. */
export const CONNECTOR_PACKAGES: readonly Dependency[] = [
  connectorPackage("wallet"),
  connectorPackage("paylink"),
];
