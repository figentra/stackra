/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/scope (the `ScopeNode` model, its service, the Postgres
 *          `ScopeTree` driver and the tree depth entitlement) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: it reaches MikroORM through @stackra/database. The
 *           migration is found by its path, as every migration is, so it is not re-exported.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0327 (decision 10); the STA-347 stand-in barrel decision.
 */
export { ScopeDepthEntitlement } from "#node/access/scope-depth.entitlement";
export { PostgresScopeTreeDriver } from "#node/drivers/postgres-scope-tree.driver";
export { ScopeNode } from "#node/models/scope-node.model";
export { ScopeNodeService } from "#node/services/scope-node.service";
