/**
 * Stackra file contract:
 * Purpose: `CanaryPromotion`, one canary to judge and act on: a product surface's release canary (the
 *          `canary:<product>:<surface>` row) or a shell line's canary (the `canary` of a `shell:<surface>:<line>` row,
 *          with the release it replaces).
 * Boundary: type only; `promoteCanary` takes it. The caller holds the canary it published (`publishProduct`'s or
 *           `publishShell`'s result); the KV port only writes.
 * Runtime: node
 * Governing contract: owner decision D6; app-shells 5.3 and 16 (points 3 and 4).
 */
import type { EdgeCanary } from "#node/types/edge-canary.type";
import type { EdgeRelease } from "#node/types/edge-release.type";
import type { EdgeShellRelease } from "#node/types/edge-shell-release.type";

/** A product release canary or a shell canary. */
export type CanaryPromotion =
  | {
      readonly kind: "release";
      readonly product: string;
      readonly surface: string;
      readonly canary: EdgeCanary<EdgeRelease>;
    }
  | {
      readonly kind: "shell";
      readonly surface: string;
      /** The shell line's major. */
      readonly line: string;
      /** The release every other host serves; a rollback writes it back alone. */
      readonly current: EdgeShellRelease;
      readonly canary: EdgeCanary<EdgeShellRelease>;
    };
