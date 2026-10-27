/**
 * Stackra file contract:
 * Purpose: `StackraManifest`, the `stackra` field of a registry item's `package.json`, per kind: every kind carries
 *          `kind`; a `package` also carries what an agent reads to place it (`tier`, `category`, `runtimes`,
 *          `summary`); an `mcp` item also carries `mcp`, its `.mcp.yaml` server entry.
 * Boundary: type only; `STACKRA_MANIFEST_SCHEMA` checks it. Not the generated `stackra.manifest.json` of a member,
 *           which is `@stackra/contracts`' `StackraManifest`.
 * Runtime: isomorphic
 * Governing contract: ADR 0453 (decision 11, amendment of 2026-10-27).
 */
import type { StackraCategory } from "#contracts/enums/stackra-category.enum";
import type { StackraKind } from "#contracts/enums/stackra-kind.enum";
import type { StackraRuntime } from "#contracts/enums/stackra-runtime.enum";
import type { StackraTier } from "#contracts/enums/stackra-tier.enum";

/** The `stackra` field of an item's `package.json`. */
export type StackraManifest =
  | {
      /** `package` when the field or the kind is missing. */
      readonly kind: "package";
      /** The turbo tier tag without `tier:`; equal to the member's folder. Optional for items from elsewhere. */
      readonly tier?: StackraTier | undefined;
      /** The `packages/<category>` folder; absent for apps, services and Workers. */
      readonly category?: StackraCategory | undefined;
      /** Where its entries run, from their `Runtime:` headers; one `runtime:<r>` turbo tag each. */
      readonly runtimes?: readonly StackraRuntime[] | undefined;
      /** One sentence for agents: when to reach for this member. Not a copy of `description`. */
      readonly summary?: string | undefined;
    }
  | {
      /** A skill, agent or plugin item. */
      readonly kind: Exclude<StackraKind, "package" | "mcp">;
    }
  | {
      readonly kind: "mcp";
      /** The server entry `stackra add mcp` writes under `mcpServers.<name>` in `.mcp.yaml`. */
      readonly mcp: Readonly<Record<string, unknown>>;
    };
