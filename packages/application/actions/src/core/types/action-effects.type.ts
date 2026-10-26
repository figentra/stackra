/**
 * Stackra file contract:
 * Purpose: `ActionEffects`, an action's `effects` option: the effect tags (`Effect`) it declares on top of its risk
 *          level, such as `financial` or `bulk`.
 * Boundary: a type only. Declared metadata, never a branch: gen copies the tags into the manifest and the registration,
 *           and the approval rules, hints and evidence filters read them from the call descriptor. A registered tag set
 *           wins over the written one, so the locked manifest is the truth at runtime.
 * Runtime: isomorphic
 * Governing contract: ADR 0099 (decision 2, as amended by ADR 0360 decision 10); ADR 0231 (snake_case codes).
 */
import type { Effect } from "#contracts/enums/effect.enum";

/** The effect tags of one action, each at most once. */
export type ActionEffects = readonly Effect[];
