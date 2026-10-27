/**
 * Stackra file contract:
 * Purpose: `SettingsStackParamList`: the routes of the Settings tab's stack and their params.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 10); React Navigation static typing.
 */

/** The routes of the Settings tab's stack and their params. */
export type SettingsStackParamList = {
  /** The Settings screen, the app's settings; takes no params. */
  Settings: undefined;
};
