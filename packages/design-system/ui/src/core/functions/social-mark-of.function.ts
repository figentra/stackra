/**
 * Stackra file contract:
 * Purpose: `socialMarkOf`, the built-in mark a sign-in provider gets: its `provider`, else its `id` when that names one.
 * Boundary: pure; no drawing.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); wave 3c mobile interactions (owner approval 2026-10-28).
 */
import { SocialMark } from "#contracts/enums/social-mark.enum";
import type { SocialProvider } from "#contracts/types/social-provider.type";

/** The provider's built-in mark, or undefined when it has none. */
export function socialMarkOf(provider: SocialProvider): SocialMark | undefined {
  if (provider.provider !== undefined) return provider.provider;
  return SocialMark.find((mark) => mark === provider.id);
}
