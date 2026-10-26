/**
 * Stackra file contract:
 * Purpose: `MarketPacksModule`, the root module of the market-pack loader: what it shares with a host. It exports
 *          `ResolvedPackSource`, so any module of a service injects the deployment's verified packs by type.
 * Boundary: the key is the package key (`market_packs`). No bindings list and no imports: gen discovers the source
 *           drivers (`store`, `memory`) and binds one from config `source` (or a host `@Replaces(ResolvedPackSource)`,
 *           the OS loader), and binds `PackStore` from its one driver, which needs the host's `FileSystem`.
 * Runtime: node
 * Governing contract: ADR 0418; ADR 0294 (decisions 12, 15 and 16); ADR 0305 (an optional root module, written here
 *                     for its export); ADR 0263 (gen writes the wiring).
 */
import { Module } from "@stackra/container";

import { ResolvedPackSource } from "#core/ports/resolved-pack-source.port";

/**
 * A host takes it by listing the package as a dependency; the hashes and keys come from the host's
 * `src/config/market-packs.config.ts` override.
 *
 * @example
 * // services/billing/package.json
 * { "dependencies": { "@stackra/market-packs": "catalog:stackra" } }
 */
export class MarketPacksModule extends Module({ exports: [ResolvedPackSource] }) {}
