/**
 * Stackra file contract:
 * Purpose: root module of @figentra/service-health. `package.json` `stackra.module` points here (ADR 0090);
 *          feature modules join `imports`. Replaced by the reference services (FW10).
 * Boundary: declares the root module class and its feature-module list; no providers and no routes.
 * Runtime: node
 * Governing contract: ADR 0007 (documentation); ADR 0090 (root module); ADR 0294 (decision 25, the Module kind base).
 * Owner: the service owner · Secrets: forbidden
 */
import { Module } from "@stackra/container";

/** The root module of the health service. Its `imports` list holds the feature modules the service hosts. */
export class HealthModule extends Module({ imports: [] }) {}
