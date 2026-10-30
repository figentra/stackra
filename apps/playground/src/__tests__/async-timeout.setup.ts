/**
 * Stackra file contract:
 * Purpose: gives Testing Library's `findBy*` and `waitFor` 15 s instead of 1 s, because the pages load their demos and
 *          ApiDoc tables lazily and a shared CI runner can take several seconds to resolve them (#181, 2026-10-30).
 * Boundary: test support only; vitest loads it through `setupFiles` before every test file.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); ADR 0182 (testing strategy).
 */
import { configure } from "@testing-library/react";

configure({ asyncUtilTimeout: 15_000 });
