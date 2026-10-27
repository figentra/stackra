/**
 * Stackra file contract:
 * Purpose: `largeTitleHeader`: tab roots add a large title that collapses into the glass header on scroll.
 * Boundary: native-stack options only, in their own file.
 * Runtime: react-native
 * Governing contract: ADR 0320 (glass and the showcase stage); ADR 0305 (rule 10).
 */
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Platform } from "react-native";

import { glassHeader } from "./header-options";

const ios = Platform.OS === "ios";

/** Tab roots add a large title that collapses into the glass header on scroll. */
export const largeTitleHeader: NativeStackNavigationOptions = {
  ...glassHeader,
  headerLargeTitle: ios,
  headerLargeTitleShadowVisible: false,
};
