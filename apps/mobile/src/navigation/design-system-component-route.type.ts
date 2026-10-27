/**
 * Stackra file contract:
 * Purpose: `DesignSystemComponentRoute`: the routes that show one design-system component: every Home route except the
 *          home and the landing.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 10); React Navigation static typing.
 */
import type { HomeStackParamList } from "./types";

/** The routes that show one design-system component: every Home route except the home and the landing. */
export type DesignSystemComponentRoute = Exclude<keyof HomeStackParamList, "Home" | "DesignSystem">;
