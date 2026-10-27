/**
 * Stackra file contract:
 * Purpose: `StackraManifest`, the `stackra` field of a registry item's `package.json`, per kind: every kind carries
 *          `kind`; an `mcp` item also carries `mcp`, its `.mcp.yaml` server entry.
 * Boundary: type only; `STACKRA_MANIFEST_SCHEMA` checks it. Not the generated `stackra.manifest.json` of a member,
 *           which is `@stackra/contracts`' `StackraManifest`.
 * Runtime: isomorphic
 * Governing contract: ADR 0453 (decision 11).
 */
import type { StackraKind } from "#contracts/enums/stackra-kind.enum";

/** The `stackra` field of an item's `package.json`. */
export type StackraManifest =
  | {
      /** Any kind but `mcp`; `package` when the field or the kind is missing. */
      readonly kind: Exclude<StackraKind, "mcp">;
    }
  | {
      readonly kind: "mcp";
      /** The server entry `stackra add mcp` writes under `mcpServers.<name>` in `.mcp.yaml`. */
      readonly mcp: Readonly<Record<string, unknown>>;
    };
