/**
 * Stackra file contract:
 * Purpose: `LibraryPresetOptions`, the options of `libraryPreset`.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0005 (legacy decorators); ADR 0022 (test placement); ADR 0295 (decision 5: generated tool
 *                     configs).
 */
/** Options of `libraryPreset`. */
export interface LibraryPresetOptions {
  /** The member root: the folder above `.stackra/`. */
  root: string;
  /** A source folder whose `.test.tsx` files run in jsdom, for example `src/react`. */
  react?: string;
  /**
   * A source folder whose `.test.tsx` files render React Native components, for example
   * `src/native`. They run in jsdom with `react-native` resolved to react-native-web, so the
   * package lists `react-native-web` (`catalog:mobile`) as a devDependency.
   */
  native?: string;
}
