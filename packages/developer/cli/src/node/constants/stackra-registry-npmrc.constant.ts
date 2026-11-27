/**
 * Stackra file contract:
 * Purpose: `STACKRA_REGISTRY_NPMRC`, the `.npmrc` lines of a new workspace root: both Stackra scopes (`@stackra`,
 *          `@stackra-pro`) resolve from the Stackra registry (ADR 0453), which `registryOrigin` reads back, so neither
 *          ever falls back to npmjs, where anyone can publish under those names.
 * Boundary: names the registry URL only; authentication comes from the developer's own login, never from this file.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 1: one registry host; decision 10: the consumer `.npmrc` maps both scopes).
 */
import { REGISTRY_ORIGIN_DEFAULT } from "#node/constants/registry-origin-default.constant";

/** The `.npmrc` text of a new workspace root. */
export const STACKRA_REGISTRY_NPMRC = `@stackra:registry=${REGISTRY_ORIGIN_DEFAULT}\n@stackra-pro:registry=${REGISTRY_ORIGIN_DEFAULT}\n`;
