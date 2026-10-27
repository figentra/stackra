/**
 * Stackra file contract:
 * Purpose: `StackraCategory`, the `stackra.category` of a `package` item: its `packages/<category>` folder (ADR 0127),
 *          `tooling` for `packages/tooling/*`. Apps, services and Workers have none.
 * Boundary: an `Enum.of` value plus the type of the same name; a new category folder needs an ADR and a case here.
 * Runtime: isomorphic
 * Governing contract: ADR 0453 (decision 11, amendment of 2026-10-27); ADR 0127 (categories); ADR 0302.
 */
import { Enum } from "@stackra/contracts";

/** One case per package category folder. */
export const StackraCategory = Enum.of({
  /** Actions, AI, rules and the registry. */
  Application: "application",
  /** Money, ledger and pricing primitives. */
  Commerce: "commerce",
  /** Webhooks, versioning, integrations and notifications. */
  Communication: "communication",
  /** Concerns that span layers. */
  CrossCutting: "cross-cutting",
  /** Model, database, content, media, search and storage. */
  Data: "data",
  /** Tokens, ui and icons. */
  DesignSystem: "design-system",
  /** CLI, gen, the coding standard and the Vite plugin. */
  Developer: "developer",
  /** Experience, navigation, panel, builder and collaboration. */
  Experience: "experience",
  /** Contracts, validation and errors every layer imports. */
  Foundation: "foundation",
  /** Pulumi packages named `infra-<name>`. */
  Infrastructure: "infrastructure",
  /** Outbox, queue, scheduler, workflow, realtime, locking and cache. */
  Runtime: "runtime",
  /** Identity, IAM, tenancy, entitlements and licensing. */
  Security: "security",
  /** Settings, feature flags and theming. */
  State: "state",
  /** The five tool presets under `packages/tooling`. */
  Tooling: "tooling",
});

/** One of the codes above. */
export type StackraCategory = Enum.Value<typeof StackraCategory>;
