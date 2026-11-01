/**
 * Stackra file contract:
 * Purpose: `STACKRA_REGISTRY_NPMRC`, the one `.npmrc` line of a new workspace root: the `@stackra` scope resolves from
 *          the Stackra registry (ADR 0453), which `registryOrigin` reads back.
 * Boundary: names the registry URL only; authentication comes from the developer's own login, never from this file.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 1: one registry host).
 */
import { REGISTRY_ORIGIN_DEFAULT } from "#node/constants/registry-origin-default.constant";

/** The `.npmrc` text of a new workspace root. */
export const STACKRA_REGISTRY_NPMRC = `@stackra:registry=${REGISTRY_ORIGIN_DEFAULT}\n`;
