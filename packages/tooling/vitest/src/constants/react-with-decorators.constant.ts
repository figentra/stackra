/**
 * Stackra file contract:
 * Purpose: `reactWithDecorators`, jsdom plus the legacy decorator transform: the base of the app and mobile presets.
 * Boundary: merges two presets; adds nothing of its own.
 * Runtime: node
 * Governing contract: ADR 0005 (legacy decorators); ADR 0022 (test placement); ADR 0295 (decision 5: generated tool
 *                     configs).
 */
import { mergeConfig } from "vitest/config";

import { stackraVitestReact } from "../preset-react.ts";
import { decoratorTransform } from "./decorator-transform.constant.ts";

/** jsdom plus the decorator transform: the base of the app presets. */
export const reactWithDecorators = mergeConfig(stackraVitestReact, decoratorTransform);
