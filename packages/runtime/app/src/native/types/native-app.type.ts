/**
 * Stackra file contract:
 * Purpose: `NativeApp`, what `createApp` from `@stackra/app/native` returns: the root component Expo registers.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0295 (decision 8).
 */
import type { FunctionComponent } from "react";

/** A native app. */
export interface NativeApp {
  /** The root component: boots behind the splash, then mounts the container and the contexts. */
  readonly Root: FunctionComponent;
}
