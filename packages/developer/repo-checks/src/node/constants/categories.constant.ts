/**
 * Stackra file contract:
 * Purpose: `CATEGORIES`, the package categories under `packages/<category>/<name>`, one per member (ADR 0127, settlement
 *          Q3.2), each with its reason and ADR.
 * Boundary: data only; part of the one machine-readable source of repository structure.
 * Runtime: node
 * Governing contract: ADR 0127; ADR 0302 (design-system).
 */

/** Package categories under `packages/<category>/<name>`, one per member (ADR 0127, settlement Q3.2). */
export const CATEGORIES = Object.freeze([
  {
    name: "foundation",
    reason: "contracts, validation and errors every layer imports",
    adr: "0127",
  },
  { name: "application", reason: "actions, AI, IR and the registry", adr: "0127" },
  {
    name: "communication",
    reason: "webhooks, versioning, integrations and mail",
    adr: "0127, 0270",
  },
  { name: "commerce", reason: "money, ledger and pricing primitives", adr: "0127" },
  {
    name: "cross-cutting",
    reason: "concerns that span layers (settlement Q3.1)",
    adr: "0127",
  },
  {
    name: "data",
    reason: "model, database, content, media, search, assets, filesystem, storage",
    adr: "0127",
  },
  {
    name: "design-system",
    reason: "the Stackra Design System: tokens, ui and icons",
    adr: "0302",
  },
  { name: "developer", reason: "CLI, gen, coding standard and the Vite plugin", adr: "0127" },
  {
    name: "experience",
    reason: "experience, navigation, console, panel, builder and collaboration",
    adr: "0127, 0270",
  },
  { name: "infrastructure", reason: "Pulumi-based packages named `infra-<name>`", adr: "0127" },
  {
    name: "runtime",
    reason: "outbox, queue, scheduler, workflow, realtime, locking and cache",
    adr: "0127",
  },
  {
    name: "security",
    reason: "identity, IAM, tenancy, connections, entitlements and licensing",
    adr: "0127",
  },
  { name: "state", reason: "settings, feature flags and theming", adr: "0127" },
]);
