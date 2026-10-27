/**
 * Stackra file contract:
 * Purpose: vitest preset for code that carries decorators: the base preset plus TypeScript legacy
 *          decorators, for the field, method (`@Step`, `@Transition`) and class facet decorators of
 *          ADR 0294 rule R6. No `design:*` metadata is emitted and nothing is loaded before the
 *          first decorated class: a constructor parameter names its dependency by its declared
 *          type, which gen reads from source into the wiring, and `reflect-metadata` is forbidden
 *          (ADR 0005, ADR 0294 decision 17).
 *
 * Mechanism (vitest 5 / vite 8): vite transforms TypeScript with oxc through rolldown's
 * `transformSync`; `oxc.decorator.legacy` is `experimentalDecorators`. The `decorators` and
 * `decorators-react` presets of @stackra/typescript-config, and the `app`, `mobile`, `desktop` and
 * `service` roles, set the matching tsc flags (`experimentalDecorators`, no `emitDecoratorMetadata`),
 * so `tsc --noEmit` and the test transform agree. `constants/decorator-transform.constant.ts` is the
 * only place the option names live.
 * Boundary: the `./preset-decorators` entry: re-exports only; it does not emit metadata.
 * Runtime: node
 * Governing contract: ADR 0005 (legacy decorators); ADR 0294 (rule R6, decision 17); ADR 0007
 *                     (documentation).
 */
export { decoratorTransform } from "./constants/decorator-transform.constant.ts";
export { stackraVitestDecorators } from "./constants/stackra-vitest-decorators.constant.ts";
