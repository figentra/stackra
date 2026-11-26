/**
 * Stackra file contract:
 * Purpose: `COLLABORATIVE_MODELS`, the process-wide registry of collaborative models by public-id prefix, which
 *          `@Collaborative` fills when a model class is defined and `RoomTokenAction` reads to find a document's model.
 * Boundary: a mutable map, written only by the decorator; a later model with the same prefix replaces the earlier one
 *           (gen refuses two owners of one prefix in a member and its hosted packages). Not re-exported.
 * Runtime: node
 * Governing contract: ADR 0346 (decision 3); ADR 0135 (a prefix names one model).
 */
import type { CollaborativeModel } from "#node/types/collaborative-model.type";

/** The collaborative models, by the prefix of their public ids (`tpl`). */
export const COLLABORATIVE_MODELS: Map<string, CollaborativeModel> = new Map();
