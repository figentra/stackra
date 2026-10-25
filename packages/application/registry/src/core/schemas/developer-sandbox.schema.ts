/**
 * Stackra file contract:
 * Purpose: `DeveloperSandbox`, the registry's record of a developer sandbox: the developer it belongs to, the sandbox
 *          scope it is, the apps under test installed in it, and when it expires.
 * Boundary: a shape class; registers this package's schema for itself when the module loads. The sandbox itself (its
 *           scope, test-mode gateways and captured messages) is tenancy's; how many a developer gets and how long they
 *           live are Figentra's settings (OS ADR 0039), never values here.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 8); ADR 0359 (decision 11: what a sandbox does).
 */
import { registerSchemas, Schema } from "@stackra/validation";

import { DEVELOPER_SANDBOX_SCHEMA } from "#core/constants/developer-sandbox-schema.constant";

/**
 * One developer sandbox.
 *
 * @example
 * validate(DeveloperSandbox, { developer: "usr_1", sandbox: "scp_9", apps: ["acme.loyalty"] });
 */
export class DeveloperSandbox extends Schema {
  /** The developer's principal id. */
  developer!: string;

  /** The sandbox scope's public id. */
  sandbox!: string;

  /** The listing keys of the apps installed for testing. */
  apps: string[] = [];

  /** When it expires, as an ISO 8601 instant; null when it does not. */
  expiresAt: string | null = null;
}

registerSchemas([[DeveloperSandbox, DEVELOPER_SANDBOX_SCHEMA]]);
