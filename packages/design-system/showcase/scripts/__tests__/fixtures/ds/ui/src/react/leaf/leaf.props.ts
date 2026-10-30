/**
 * Stackra file contract:
 * Purpose: gen-api test fixture: a leaf component whose props refuse a HeroUI-style name it replaces.
 * Boundary: test data only.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */
import type { LeafVariant } from "./leaf-variant.type";

interface UpstreamLeafProps {
  /** Upstream pending flag. */
  isPending?: boolean;
  /** Upstream slot. */
  render?: () => unknown;
}

/** Props of the fixture leaf. */
export type LeafProps = {
  /** The look. Defaults to `primary`. */
  readonly variant?: LeafVariant | undefined;
  /** True while busy. */
  readonly isLoading?: boolean | undefined;
  /** Called on press. */
  readonly onPress?: (() => void) | undefined;
  /** @deprecated use variant */
  readonly tone?: string;
} & Omit<UpstreamLeafProps, "isPending">;
