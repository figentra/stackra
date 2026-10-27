/**
 * Stackra file contract:
 * Purpose: `stackraVitestDecorators`, the base preset plus the legacy decorator transform.
 * Boundary: merges two presets; adds nothing of its own.
 * Runtime: node
 * Governing contract: ADR 0005 (legacy decorators); ADR 0294 (rule R6, decision 17).
 */
import { mergeConfig } from "vitest/config";

import { stackraVitest } from "../preset.ts";
import { decoratorTransform } from "./decorator-transform.constant.ts";

/** Base preset + legacy decorators (no metadata emission). */
export const stackraVitestDecorators = mergeConfig(stackraVitest, decoratorTransform);
