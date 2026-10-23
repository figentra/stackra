/**
 * Stackra file contract:
 * Purpose: the context that tells a native Skeleton it sits inside a SkeletonGroup, so it renders HeroUI Native's
 *          group item; `false` outside a group.
 * Boundary: the context object only; internal, in no barrel.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0304.
 */
import { createContext } from "react";

/** Whether the Skeleton is inside a native SkeletonGroup. */
export const SkeletonGroupContext = createContext(false);
